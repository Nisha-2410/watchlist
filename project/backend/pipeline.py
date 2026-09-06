"""Provider → normalized snapshots → shared insight pipeline."""
from __future__ import annotations
import json
from datetime import datetime, timezone
from statistics import median, pstdev
from backend import store
from backend.cache import history_or_fetch
from backend.providers.registry import news_provider, quote_router
from backend.significance import MODEL_VERSION, Signals, classify, confidence, rank_score

CONFLICT_PERCENT = 2.0
QUOTE_CACHE_SECONDS = 300

def _record_health(c, provider, kind, symbol, error=None):
    row = c.execute("SELECT consecutive_failures FROM provider_health WHERE provider=? AND kind=? AND symbol=?", (provider, kind, symbol)).fetchone()
    failures = (row["consecutive_failures"] if row else 0) + 1 if error else 0
    c.execute("""INSERT INTO provider_health(provider,kind,symbol,last_success_at,last_error_at,last_error,consecutive_failures)
                 VALUES(?,?,?,?,?,?,?) ON CONFLICT(provider,kind,symbol) DO UPDATE SET
                 last_success_at=excluded.last_success_at,last_error_at=excluded.last_error_at,
                 last_error=excluded.last_error,consecutive_failures=excluded.consecutive_failures""",
              (provider, kind, symbol, store.now() if not error else None, store.now() if error else None, str(error) if error else None, failures))

def refresh(symbol):
    """Ingest configured sources. Live failures are recorded and never become demo data."""
    c = store.con()
    try:
        router = quote_router(symbol, c)
        has_snapshots = c.execute("SELECT 1 FROM market_snapshots WHERE symbol=? LIMIT 1", (symbol,)).fetchone()
        fetch = router.history if not has_snapshots else router.recent_history
        history, source, served_stale = history_or_fetch(c, f"quote:{symbol}", QUOTE_CACHE_SECONDS, lambda: fetch(symbol))
        # Router failures are persisted even when a lower-priority provider succeeds.
        for provider, error in router.failures: _record_health(c, provider, "quote", symbol, error)
        if not history: raise RuntimeError(f"No cached or fresh quote history for {symbol}")
        for item in history:
            c.execute("INSERT OR IGNORE INTO market_snapshots(symbol,timestamp,price,volume,source) VALUES(?,?,?,?,?)", (symbol, item.timestamp.isoformat(), item.price, item.volume, source))
        _record_health(c, source, "quote", symbol, RuntimeError("served stale cache after provider failure")) if served_stale else _record_health(c, source, "quote", symbol)
        ingest_sample_context_events(symbol, history[-1].timestamp.isoformat(), c)
        c.commit()
        compute(symbol, c)
    finally: c.close()

def ingest_news(symbol):
    """Independent scheduled entry point for normalised market-event ingestion."""
    c, provider = store.con(), news_provider()
    try:
        for event in provider.events(symbol):
            c.execute("INSERT OR IGNORE INTO market_events(symbol,layer,category,title,detail,source,timestamp,status) VALUES(?,?,?,?,?,?,?,?)", (symbol,event.layer,event.category,event.title,event.detail,provider.name,event.timestamp.isoformat(),"active"))
        _record_health(c, provider.name, "news", symbol); c.commit()
    except Exception as error:
        _record_health(c, provider.name, "news", symbol, error); c.commit(); raise
    finally: c.close()

SAMPLE_CONTEXT_SOURCE = "sample-context"

def ingest_sample_context_events(symbol, timestamp, c):
    """Illustrative timeline rows. Not a news provider and not live filings."""
    date = timestamp[:10]
    events = [
        ("Company", "announcement", f"{symbol} sample company update", "Illustrative company disclosure for timeline layout; not a live filing."),
        ("Sector", "sector", f"{symbol} sector context sample", "Illustrative sector comparison for layout testing; not a live sector event."),
        ("Domestic", "market", "Sample market context update", "Illustrative domestic market context; shown as context, not cause, and not live news."),
    ]
    for layer,category,title,detail in events:
        if not c.execute("SELECT id FROM market_events WHERE symbol=? AND title=? AND timestamp LIKE ?", (symbol,title,f"{date}%")).fetchone():
            c.execute("INSERT INTO market_events(symbol,layer,category,title,detail,source,timestamp,status) VALUES(?,?,?,?,?,?,?,?)", (symbol,layer,category,title,detail,SAMPLE_CONTEXT_SOURCE,timestamp,"active"))
    thread = c.execute("SELECT id FROM event_threads WHERE symbol=? AND category='announcement' AND status='active'", (symbol,)).fetchone()
    thread_id = thread["id"] if thread else c.execute("INSERT INTO event_threads(symbol,category,status,opened_at,updated_at) VALUES(?,?,?,?,?)", (symbol,"announcement","active",timestamp,timestamp)).lastrowid
    for event in c.execute("SELECT id FROM market_events WHERE symbol=? AND category='announcement'", (symbol,)).fetchall(): c.execute("INSERT OR IGNORE INTO thread_events(thread_id,event_id) VALUES(?,?)", (thread_id,event["id"]))

def _latest_consensus(c, symbol):
    rows = c.execute("SELECT * FROM market_snapshots WHERE symbol=? ORDER BY timestamp DESC", (symbol,)).fetchall()
    if not rows: return None, False
    latest = rows[0]
    # One source can have many 5m prints the same day; conflict is latest-per-source disagreement.
    latest_by_source = {}
    for row in rows:
        if row["timestamp"][:10] == latest["timestamp"][:10]:
            latest_by_source.setdefault(row["source"], row)
    prices = [row["price"] for row in latest_by_source.values() if row["price"]]
    return latest, len(prices) > 1 and (max(prices) - min(prices)) / min(prices) * 100 > CONFLICT_PERCENT

def leave_one_out_zscore(symbol_return, peer_returns):
    """Robustly compare a move with its peer group without one outlier dominating."""
    if len(peer_returns) < 2: return 0.0
    centre = median(peer_returns); mad = median([abs(value-centre) for value in peer_returns])
    scale = 1.4826*mad if mad else (pstdev(peer_returns) or 1e-9)
    return max(-15.0, min(15.0, (symbol_return-centre)/scale))

def _daily_returns(c, symbol, window=61):
    rows=c.execute("SELECT timestamp,price FROM market_snapshots WHERE symbol=? ORDER BY timestamp,id",(symbol,)).fetchall(); daily={}
    for row in rows: daily[row['timestamp'][:10]]=row['price']
    values=list(daily.items())[-window:]
    return {day:(price/values[index-1][1]-1)*100 for index,(day,price) in enumerate(values) if index and values[index-1][1]}

def _correlation(left, right):
    common=sorted(set(left)&set(right))
    if len(common)<20:return None
    xs=[left[day] for day in common]; ys=[right[day] for day in common]; xmean=sum(xs)/len(xs); ymean=sum(ys)/len(ys)
    denominator=(sum((x-xmean)**2 for x in xs)*sum((y-ymean)**2 for y in ys))**0.5
    return sum((x-xmean)*(y-ymean) for x,y in zip(xs,ys))/denominator if denominator else None

def _latest_two_price_move(c, symbol):
    """Same snapshot-to-snapshot percent move used for peers and the sector benchmark."""
    rows = c.execute("SELECT price FROM market_snapshots WHERE symbol=? ORDER BY timestamp DESC LIMIT 2", (symbol,)).fetchall()
    if len(rows) == 2 and rows[1]["price"]:
        return (rows[0]["price"] / rows[1]["price"] - 1) * 100
    return None

def peer_divergence_context(c, symbol, symbol_move):
    """Return peer context only when stored daily returns show a real relationship."""
    target_returns=_daily_returns(c,symbol); peer_moves=[]; correlations=[]
    for peer in c.execute("SELECT peer_symbol FROM peer_relationships WHERE symbol=?",(symbol,)).fetchall():
        peer_symbol=peer['peer_symbol']; peer_move=_latest_two_price_move(c, peer_symbol)
        if peer_move is not None: peer_moves.append(peer_move)
        correlation=_correlation(target_returns,_daily_returns(c,peer_symbol))
        if correlation is not None: correlations.append(correlation)
    peer_move=median(peer_moves) if peer_moves else 0.0; correlation=median(correlations) if correlations else None; zscore=leave_one_out_zscore(symbol_move,peer_moves)
    return peer_move,zscore,correlation,bool(correlation is not None and correlation>=0.30 and abs(zscore)>=2.0)

def sector_benchmark_context(c, symbol):
    """Look up this stock's sector benchmark move. Independent of peer_relationships math."""
    security = c.execute("SELECT sector FROM securities WHERE symbol=?", (symbol,)).fetchone()
    if not security:
        return None, None
    bench = c.execute("SELECT benchmark_symbol FROM sector_benchmarks WHERE sector=?", (security["sector"],)).fetchone()
    if not bench or bench["benchmark_symbol"] == symbol:
        return None, None
    return bench["benchmark_symbol"], _latest_two_price_move(c, bench["benchmark_symbol"])

def compute(symbol, c=None):
    own = c is None; c = c or store.con()
    try:
        rows = c.execute("SELECT * FROM market_snapshots WHERE symbol=? ORDER BY timestamp", (symbol,)).fetchall()
        if len(rows) < 2: return
        latest, conflicting = _latest_consensus(c, symbol); prior = next((row for row in reversed(rows[:-1]) if row["source"] == latest["source"]), rows[-2]); baseline = prior
        move = (latest["price"]/baseline["price"]-1)*100; vols = [row["volume"] or 0 for row in rows[-31:-1]]; vr = (latest["volume"] or 0)/(sum(vols)/len(vols) or 1)
        returns = [(rows[i]["price"]/rows[i-1]["price"]-1)*100 for i in range(1,len(rows)) if rows[i-1]["price"]]; volatility = pstdev(returns[-20:]) if len(returns)>2 else 0; historical=[abs(x) for x in returns[-90:-1]]; unusualness=abs(move)/(sum(historical)/len(historical) or 1) if historical else 0
        peer_move,peer_zscore,peer_correlation,peer_divergence=peer_divergence_context(c,symbol,move); relative_move=move-peer_move
        benchmark_symbol,benchmark_move=sector_benchmark_context(c,symbol)
        event=c.execute("SELECT 1 FROM market_events WHERE symbol=? AND abs(strftime('%s',timestamp)-strftime('%s',?))<=14400 LIMIT 1",(symbol,latest["timestamp"])).fetchone(); stale=(datetime.now(timezone.utc)-datetime.fromisoformat(latest["timestamp"])).total_seconds()>172800
        signals=Signals(move,relative_move=relative_move,volume_ratio=vr,event_match=bool(event),peer_divergence=peer_divergence,stale=stale,conflicting_sources=conflicting,volatility=volatility,historical_unusualness=unusualness)
        evidence=[f"{move:+.1f}% price move since baseline",f"{vr:.1f}× 30-day comparable volume",f"Realized volatility {volatility:.2f}%"]
        if peer_correlation is not None:evidence.append(f"{relative_move:+.1f} percentage points versus peers (correlation {peer_correlation:.2f})")
        if peer_divergence:evidence.append(f"Robust peer-divergence score {peer_zscore:+.1f} passed the correlation gate")
        if benchmark_symbol and benchmark_move is not None:evidence.append(f"Sector benchmark ({benchmark_symbol}) moved {benchmark_move:+.1f}% vs this stock's {move:+.1f}%")
        if unusualness>=2:evidence.append(f"Move is {unusualness:.1f}× its recent average daily movement")
        if event:evidence.append("Company event detected near the market move")
        if conflicting:evidence.append(f"Configured providers disagree by more than {CONFLICT_PERCENT:.0f}%")
        freshness="Demo data · simulated provider" if latest["source"]=="demo" else ("Conflicting provider data" if conflicting else "Delayed end-of-day provider data")
        c.execute("INSERT OR REPLACE INTO derived_insights VALUES(?,?,?,?,?,?,?,?,?,?,?)",(symbol,store.now(),baseline["price"],latest["price"],classify(signals),confidence(signals),rank_score(signals),json.dumps({"absoluteMove":move,"relativeMove":relative_move,"volumeRatio":vr,"volatility":volatility,"historicalUnusualness":unusualness,"peerMove":peer_move,"peerZScore":peer_zscore,"peerCorrelation":peer_correlation,"sectorBenchmark":benchmark_symbol,"sectorBenchmarkMove":benchmark_move,"conflictingSources":conflicting,"stale":stale}),json.dumps(evidence),MODEL_VERSION,freshness)); c.commit()
    finally:
        if own:c.close()
