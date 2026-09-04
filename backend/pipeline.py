"""Provider → normalized snapshots → shared insight pipeline."""
import json, urllib.request, urllib.parse, os, hashlib
from datetime import datetime, timezone, timedelta
from statistics import pstdev
from backend import store
from backend.significance import Signals, classify, confidence, rank_score, MODEL_VERSION

class YahooProvider:
    name="yahoo-finance"
    def history(self,symbol):
        url=f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?range=3mo&interval=1d"
        with urllib.request.urlopen(url,timeout=12) as r: raw=json.load(r)["chart"]["result"][0]
        q=raw["indicators"]["quote"][0]; closes=raw["indicators"]["adjclose"][0]["adjclose"]
        return [(datetime.fromtimestamp(t,timezone.utc).isoformat(),p,v) for t,p,v in zip(raw["timestamp"],closes,q["volume"]) if p is not None]
class DemoProvider:
    name="demo"
    def history(self,symbol):
        seed=int(hashlib.sha256(symbol.encode()).hexdigest()[:8],16); base=80+seed%900; n=datetime.now(timezone.utc)
        r=[((n-timedelta(days=90-i)).isoformat(),round(base*(1+((seed>>i)%7-3)*i/5000),2),900000+seed%2000000+i*2000) for i in range(91)]
        r[-1]=(n.isoformat(),round(r[-2][1]*(1+((seed%8)-3)/100),2),r[-2][2]*(2+(seed%2))); return r

def refresh(symbol):
    p=DemoProvider() if os.getenv('DEMO_MODE','true').lower()=='true' else YahooProvider(); history=p.history(symbol); c=store.con()
    for ts,price,volume in history:c.execute("INSERT OR IGNORE INTO market_snapshots(symbol,timestamp,price,volume,source) VALUES(?,?,?,?,?)",(symbol,ts,price,volume,p.name))
    if p.name == 'demo': ingest_demo_events(symbol, history[-1][0], c)
    c.commit(); compute(symbol,c);c.close()

def ingest_demo_events(symbol, timestamp, c):
    """Creates explicit simulated event data only in demo mode for UI verification."""
    date=timestamp[:10]
    events=[
        ('Company','announcement',f'{symbol} simulated company update','Demo company disclosure for timeline testing.'),
        ('Sector','sector',f'{symbol} sector context updated','Simulated sector comparison is available.'),
        ('Domestic','market', 'Market context update','Simulated domestic market context; shown as context, not cause.'),
    ]
    for layer,category,title,detail in events:
        exists=c.execute("SELECT id FROM market_events WHERE symbol=? AND title=? AND timestamp LIKE ?",(symbol,title,f'{date}%')).fetchone()
        if not exists:
            c.execute("INSERT INTO market_events(symbol,layer,category,title,detail,source,timestamp,status) VALUES(?,?,?,?,?,?,?,?)",(symbol,layer,category,title,detail,'demo-provider',timestamp,'active'))
    thread=c.execute("SELECT id FROM event_threads WHERE symbol=? AND category='announcement' AND status='active'",(symbol,)).fetchone()
    if not thread:
        cursor=c.execute("INSERT INTO event_threads(symbol,category,status,opened_at,updated_at) VALUES(?,?,?,?,?)",(symbol,'announcement','active',timestamp,timestamp)); thread_id=cursor.lastrowid
    else: thread_id=thread['id']; c.execute("UPDATE event_threads SET updated_at=? WHERE id=?",(timestamp,thread_id))
    for event in c.execute("SELECT id FROM market_events WHERE symbol=? AND category='announcement'",(symbol,)).fetchall():
        c.execute("INSERT OR IGNORE INTO thread_events(thread_id,event_id) VALUES(?,?)",(thread_id,event['id']))

def compute(symbol,c=None):
    own=c is None;c=c or store.con(); rows=c.execute("SELECT * FROM market_snapshots WHERE symbol=? ORDER BY timestamp",(symbol,)).fetchall()
    if len(rows)<2:return
    latest,prior=rows[-1],rows[-2]; baseline=rows[max(0,len(rows)-2)]; move=(latest['price']/baseline['price']-1)*100
    vols=[r['volume'] or 0 for r in rows[-31:-1]];vr=(latest['volume'] or 0)/(sum(vols)/len(vols) or 1)
    returns=[(rows[i]['price']/rows[i-1]['price']-1)*100 for i in range(1,len(rows))];volatility=pstdev(returns[-20:]) if len(returns)>2 else 0
    historical_moves=[abs(x) for x in returns[-90:-1]]
    unusualness=(abs(move)/(sum(historical_moves)/len(historical_moves) or 1)) if historical_moves else 0
    peer_moves=[]
    for peer in c.execute("SELECT peer_symbol FROM peer_relationships WHERE symbol=?",(symbol,)).fetchall():
        peer_rows=c.execute("SELECT price FROM market_snapshots WHERE symbol=? ORDER BY timestamp DESC LIMIT 2",(peer['peer_symbol'],)).fetchall()
        if len(peer_rows)==2 and peer_rows[1]['price']:
            peer_moves.append((peer_rows[0]['price']/peer_rows[1]['price']-1)*100)
    peer_move=(sum(peer_moves)/len(peer_moves)) if peer_moves else 0
    relative_move=move-peer_move
    event=c.execute("SELECT 1 FROM market_events WHERE symbol=? AND abs(strftime('%s',timestamp)-strftime('%s',?))<=14400 LIMIT 1",(symbol,latest['timestamp'])).fetchone()
    s=Signals(move,relative_move=relative_move,volume_ratio=vr,event_match=bool(event),peer_divergence=bool(peer_moves and abs(relative_move)>=3));tier=classify(s);ev=[f"{move:+.1f}% price move since baseline",f"{vr:.1f}× 30-day comparable volume",f"Realized volatility {volatility:.2f}%"]
    if peer_moves: ev.append(f"{relative_move:+.1f} percentage points versus available peers")
    if unusualness >= 2: ev.append(f"Move is {unusualness:.1f}× its recent average daily movement")
    if event:ev.append("Company event detected near the market move")
    fresh='Demo data · simulated provider' if latest['source']=='demo' else 'Delayed end-of-day provider data';c.execute("INSERT OR REPLACE INTO derived_insights VALUES(?,?,?,?,?,?,?,?,?,?,?)",(symbol,store.now(),baseline['price'],latest['price'],tier,confidence(s),rank_score(s),json.dumps({'absoluteMove':move,'relativeMove':relative_move,'volumeRatio':vr,'volatility':volatility,'historicalUnusualness':unusualness,'peerMove':peer_move}),json.dumps(ev),MODEL_VERSION,fresh));c.commit()
    if own:c.close()
