"""Small local API for Smart Market Watchlist.

Demo mode is intentional and visible in the UI. Production integrations belong
behind QuoteProvider and must never turn demo values into a live-data claim.
"""
from __future__ import annotations

import json
import os
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
from http.cookies import SimpleCookie
from backend import store
from backend import pipeline

ROOT = Path(__file__).resolve().parents[1]
# Used for local single-process development only; Vercel serves the frontend in
# the split deployment, so this directory is unused there but intentionally kept.
FRONTEND_DIST = ROOT / "frontend" / "dist"
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "").rstrip("/")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # API routing below is unchanged.  Static requests are served by the
        # compiled React application so the page at :8000 is the same frontend
        # developed in frontend/, rather than the retired app/app.js shell.
        super().__init__(*args, directory=str(FRONTEND_DIST), **kwargs)

    def api(self, payload, status=HTTPStatus.OK, token=None):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self._cors_headers()
        if token: self.send_header("Set-Cookie", f"session={token}; Path=/; HttpOnly; SameSite=None; Secure")
        self.end_headers(); self.wfile.write(data)

    def _cors_headers(self):
        """Allow the configured Vercel origin to send credentialed API requests."""
        if ALLOWED_ORIGIN:
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Vary", "Origin")

    def do_OPTIONS(self):
        if urlparse(self.path).path.startswith("/api/"):
            self.send_response(HTTPStatus.NO_CONTENT)
            self._cors_headers()
            self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Max-Age", "600")
            self.end_headers()
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/home":
            auth=self.current_user()
            if not auth: return self.api({"error":"Authentication required"},HTTPStatus.UNAUTHORIZED)
            return self.api(self.user_home(auth["id"]))
        if path == "/api/search":
            if not self.current_user(): return self.api({"error":"Authentication required"},HTTPStatus.UNAUTHORIZED)
            q=unquote(parse_qs(urlparse(self.path).query).get('q',[''])[0]).upper().strip()
            if not q:return self.api({"results":[]})
            c=store.con(); rows=c.execute("SELECT * FROM securities WHERE upper(symbol) LIKE ? OR upper(name) LIKE ? OR upper(exchange) LIKE ? OR upper(sector) LIKE ? LIMIT 8",(f"%{q}%",f"%{q}%",f"%{q}%",f"%{q}%")).fetchall();return self.api({"results":[dict(x) for x in rows]})
        if path == "/api/settings":
            user=self.current_user()
            if not user:return self.api({'error':'Authentication required'},HTTPStatus.UNAUTHORIZED)
            c=store.con(); row=c.execute("SELECT price,volume,news,earnings,corporate_actions FROM preferences WHERE user_id=?",(user['id'],)).fetchone(); payload=dict(row);payload['mutedCategories']=[x['category'] for x in c.execute('SELECT category FROM muted_categories WHERE user_id=?',(user['id'],)).fetchall()];return self.api(payload)
        if path == "/api/watchlist/manage":
            user=self.current_user()
            if not user:return self.api({'error':'Authentication required'},HTTPStatus.UNAUTHORIZED)
            c=store.con(); rows=c.execute("SELECT w.symbol,w.watch_type,w.expires_at,w.threshold,w.mute,s.name FROM watch_entries w JOIN securities s ON s.symbol=w.symbol WHERE w.user_id=?",(user['id'],)).fetchall()
            return self.api({'entries':[dict(x) for x in rows],'mutedCategories':[x['category'] for x in c.execute('SELECT category FROM muted_categories WHERE user_id=?',(user['id'],)).fetchall()]})
        if path.startswith("/api/stocks/") and path.endswith("/timeline"):
            if not self.current_user(): return self.api({"error":"Authentication required"},HTTPStatus.UNAUTHORIZED)
            symbol=path.split('/')[3].upper(); layer=urlparse(self.path).query.replace('layer=','')
            c=store.con(); sql="SELECT * FROM market_events WHERE symbol=?"; params=[symbol]
            if layer and layer != 'All': sql+=" AND layer=?"; params.append(layer)
            events=[dict(x) for x in c.execute(sql+" ORDER BY timestamp DESC",params).fetchall()]
            threads=[]
            for thread in c.execute("SELECT t.*, count(te.event_id) AS event_count FROM event_threads t LEFT JOIN thread_events te ON te.thread_id=t.id WHERE t.symbol=? GROUP BY t.id ORDER BY t.updated_at DESC",(symbol,)).fetchall():
                item=dict(thread)
                item['events']=[dict(event) for event in c.execute("SELECT e.* FROM thread_events te JOIN market_events e ON e.id=te.event_id WHERE te.thread_id=? ORDER BY e.timestamp ASC",(thread['id'],)).fetchall()]
                threads.append(item)
            return self.api({'events':events,'threads':threads,'demo':all(e['source']=='demo-provider' for e in events)})
        if path.startswith("/api/stocks/"):
            symbol = path.rsplit("/", 1)[-1].upper()
            user=self.current_user()
            if not user:return self.api({"error":"Authentication required"},HTTPStatus.UNAUTHORIZED)
            c=store.con();i=c.execute("SELECT * FROM derived_insights WHERE symbol=?",(symbol,)).fetchone();sec=c.execute("SELECT * FROM securities WHERE symbol=?",(symbol,)).fetchone();events=c.execute("SELECT * FROM market_events WHERE symbol=? ORDER BY timestamp DESC",(symbol,)).fetchall(); history=c.execute("SELECT timestamp,price,volume FROM market_snapshots WHERE symbol=? ORDER BY timestamp DESC LIMIT 90",(symbol,)).fetchall()
            if not sec:return self.api({"error":"Unknown security"},HTTPStatus.NOT_FOUND)
            reviewed=bool(user and i and c.execute("SELECT 1 FROM acknowledgements WHERE user_id=? AND event_key=?",(user['id'],f"{symbol}:{i['computed_at']}")).fetchone())
            comparison=None
            if len(history)>=2:
                current,baseline=history[0],history[1]
                difference=current['price']-baseline['price']
                comparison={'baselinePrice':baseline['price'],'baselineTimestamp':baseline['timestamp'],'currentPrice':current['price'],'currentTimestamp':current['timestamp'],'absoluteDifference':difference,'percentageDifference':(difference/baseline['price']*100) if baseline['price'] else None}
            return self.api({'stock':dict(sec),'insight':dict(i) if i else None,'comparison':comparison,'timeline':[dict(x) for x in events],'history':[dict(x) for x in reversed(history)],'context':self.stock_context(symbol,c),'reviewed':reviewed})
        if path.startswith("/api/"): return self.api({"error":"Not found"}, HTTPStatus.NOT_FOUND)
        return super().do_GET()

    def do_POST(self):
        path=urlparse(self.path).path; length=int(self.headers.get("Content-Length",0)); body=json.loads(self.rfile.read(length) or b"{}")
        if path == "/api/auth/signup":
            try: return self.api({"ok":True},token=store.signup(body["email"],body["password"]))
            except (KeyError,ValueError) as e:return self.api({"error":str(e)},HTTPStatus.BAD_REQUEST)
        if path == "/api/auth/login":
            try:return self.api({"ok":True},token=store.login(body["email"],body["password"]))
            except (KeyError,ValueError) as e:return self.api({"error":str(e)},HTTPStatus.UNAUTHORIZED)
        if path == "/api/auth/logout":
            cookie=SimpleCookie(self.headers.get("Cookie")); token=cookie.get("session")
            if token:
                c=store.con();c.execute("DELETE FROM sessions WHERE token=?",(token.value,));c.commit()
            return self.api({"ok":True})
        user=self.current_user()
        if not user:return self.api({"error":"Authentication required"},HTTPStatus.UNAUTHORIZED)
        if path == "/api/watchlist":
            symbol=body.get("symbol","").upper();c=store.con(); sec=c.execute("SELECT symbol FROM securities WHERE symbol=?",(symbol,)).fetchone()
            if not sec:return self.api({"error":"Unknown security"},HTTPStatus.NOT_FOUND)
            if c.execute("SELECT count(*) FROM watch_entries WHERE user_id=?",(user["id"],)).fetchone()[0]>=100:return self.api({"error":"Watchlist limit is 100"},HTTPStatus.CONFLICT)
            c.execute("INSERT OR IGNORE INTO watch_entries(user_id,symbol,watch_type,expires_at,added_at) VALUES(?,?,?,?,?)",(user["id"],symbol,body.get("watchType","permanent"),body.get("expiresAt"),store.now()));c.commit();return self.api({"ok":True})
        if path == "/api/watchlist/manage":
            symbol=body.get('symbol','').upper(); c=store.con(); fields=[]; values=[]
            if 'threshold' in body: fields.append('threshold=?');values.append(body['threshold'])
            if 'mute' in body: fields.append('mute=?');values.append(int(bool(body['mute'])))
            if 'watchType' in body: fields.append('watch_type=?');values.append(body['watchType'])
            if 'expiresAt' in body: fields.append('expires_at=?');values.append(body['expiresAt'])
            if not fields:return self.api({'error':'No editable watch properties'},HTTPStatus.BAD_REQUEST)
            values.extend([user['id'],symbol]);c.execute('UPDATE watch_entries SET '+','.join(fields)+' WHERE user_id=? AND symbol=?',values);c.commit();return self.api({'ok':True})
        if path == '/api/settings/muted-categories':
            category=body.get('category','').strip(); c=store.con()
            if not category:return self.api({'error':'Category required'},HTTPStatus.BAD_REQUEST)
            if body.get('muted'):c.execute('INSERT OR IGNORE INTO muted_categories VALUES(?,?)',(user['id'],category))
            else:c.execute('DELETE FROM muted_categories WHERE user_id=? AND category=?',(user['id'],category))
            c.commit();return self.api({'ok':True})
        if path == "/api/refresh":
            try:
                for r in store.con().execute("SELECT symbol FROM watch_entries WHERE user_id=? AND (expires_at IS NULL OR expires_at > ?)",(user["id"],store.now())).fetchall(): pipeline.refresh(r["symbol"])
                return self.api({"ok":True})
            except Exception as e:return self.api({"error":"Provider refresh failed","detail":str(e)},HTTPStatus.BAD_GATEWAY)
        # Acknowledgements are user-scoped and persist independently of shared insights.
        if path == "/api/acknowledgments":
            c=store.con(); symbol=body.get("symbol","").upper(); insight=c.execute("SELECT computed_at FROM derived_insights WHERE symbol=?",(symbol,)).fetchone()
            if not insight:return self.api({"error":"No derived insight to review"},HTTPStatus.CONFLICT)
            c.execute("INSERT OR REPLACE INTO acknowledgements VALUES(?,?,?)",(user["id"],f"{symbol}:{insight['computed_at']}",store.now()));c.commit();return self.api({"ok":True})
        if path in ("/api/settings",):
            allowed=('price','volume','news','earnings','corporate_actions'); updates={k:int(bool(body[k])) for k in allowed if k in body}
            if not updates:return self.api({'error':'No supported preference'},HTTPStatus.BAD_REQUEST)
            c=store.con(); c.execute("UPDATE preferences SET "+','.join(f"{k}=?" for k in updates)+" WHERE user_id=?",(*updates.values(),user['id']));c.commit();return self.api({'ok':True})
        return self.api({"error":"Not found"}, HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        user=self.current_user();path=urlparse(self.path).path
        if not user:return self.api({"error":"Authentication required"},HTTPStatus.UNAUTHORIZED)
        if path.startswith("/api/watchlist/"):
            c=store.con();c.execute("DELETE FROM watch_entries WHERE user_id=? AND symbol=?",(user["id"],path.rsplit('/',1)[-1].upper()));c.commit();return self.api({"ok":True})
        return self.api({"error":"Not found"},HTTPStatus.NOT_FOUND)

    def current_user(self):
        cookie=SimpleCookie(self.headers.get("Cookie"));m=cookie.get("session");return store.user(m.value) if m else None

    def stock_context(self,symbol,c):
        """Read shared peer/benchmark comparisons; it never asserts causality."""
        sec=c.execute("SELECT sector FROM securities WHERE symbol=?",(symbol,)).fetchone()
        insight=c.execute("SELECT signals_json FROM derived_insights WHERE symbol=?",(symbol,)).fetchone()
        signal=json.loads(insight['signals_json']) if insight else {}
        peers=[]
        for r in c.execute("SELECT s.symbol,s.name,i.signals_json FROM peer_relationships p JOIN securities s ON s.symbol=p.peer_symbol LEFT JOIN derived_insights i ON i.symbol=s.symbol WHERE p.symbol=?",(symbol,)).fetchall():
            peer_signal=json.loads(r['signals_json']) if r['signals_json'] else {}
            peers.append({'symbol':r['symbol'],'name':r['name'],'move':peer_signal.get('absoluteMove'),'freshness':'Available' if r['signals_json'] else 'Missing'})
        benchmark=c.execute("SELECT benchmark_symbol FROM sector_benchmarks WHERE sector=?",(sec['sector'],)).fetchone() if sec else None
        benchmark_move=None
        if benchmark:
            r=c.execute("SELECT signals_json FROM derived_insights WHERE symbol=?",(benchmark['benchmark_symbol'],)).fetchone()
            benchmark_move=json.loads(r['signals_json']).get('absoluteMove') if r else None
        return {'stockMove':signal.get('absoluteMove'),'sector':sec['sector'] if sec else None,'benchmarkSymbol':benchmark['benchmark_symbol'] if benchmark else None,'benchmarkMove':benchmark_move,'peerMove':signal.get('peerMove'),'peers':peers,'label':'Context only — comparisons do not establish a cause.'}

    def user_home(self,uid):
        c=store.con(); rows=c.execute("SELECT s.*, w.watch_type, w.mute FROM watch_entries w JOIN securities s ON s.symbol=w.symbol WHERE w.user_id=? AND (w.expires_at IS NULL OR w.expires_at > ?)",(uid,store.now())).fetchall()
        preferences=c.execute("SELECT price,volume,news,earnings,corporate_actions FROM preferences WHERE user_id=?",(uid,)).fetchone()
        muted_categories={r['category'] for r in c.execute("SELECT category FROM muted_categories WHERE user_id=?",(uid,)).fetchall()}
        symbols=[r['symbol'] for r in rows]
        if symbols:
            placeholders=','.join('?' for _ in symbols)
            insights={r['symbol']:r for r in c.execute(f"SELECT * FROM derived_insights WHERE symbol IN ({placeholders})",symbols).fetchall()}
            keys=[f"{symbol}:{insight['computed_at']}" for symbol,insight in insights.items()]
            reviewed={r['event_key'] for r in c.execute(f"SELECT event_key FROM acknowledgements WHERE user_id=? AND event_key IN ({','.join('?' for _ in keys)})",[uid,*keys]).fetchall()} if keys else set()
            categories={symbol:set() for symbol in symbols}
            for event in c.execute(f"SELECT symbol,category,timestamp FROM market_events WHERE symbol IN ({placeholders})",symbols).fetchall():
                insight=insights.get(event['symbol'])
                if not insight or event['timestamp'] >= insight['computed_at']: categories[event['symbol']].add(event['category'])
        else: insights={}; reviewed=set(); categories={}
        stocks=[]
        for r in rows:
            i=insights.get(r['symbol']); signal=json.loads(i['signals_json']) if i else {}
            key=f"{r['symbol']}:{i['computed_at']}" if i else None; is_reviewed=bool(key and key in reviewed)
            preference_rank=(i['rank_score'] if i else 0)
            if preferences and not preferences['volume']: preference_rank-=max(0,signal.get('volumeRatio',1)-1)
            if preferences and not preferences['price']: preference_rank-=abs(signal.get('absoluteMove',0))
            de_emphasized=bool(r['mute']) or bool(categories.get(r['symbol'],set()) & muted_categories)
            stocks.append({'symbol':r['symbol'],'name':r['name'],'exchange':r['exchange'],'sector':r['sector'],'tier':i['tier'] if i else 'Normal','confidence':i['confidence'] if i else 'Low','freshness':i['freshness'] if i else 'Awaiting provider refresh','watchType':r['watch_type'],'price':i['current_price'] if i else None,'move':signal.get('absoluteMove',0),'relative':signal.get('relativeMove',0),'volume':signal.get('volumeRatio',0),'evidence':json.loads(i['evidence_json']) if i else ['No provider snapshot is available yet'],'insightKey':key,'reviewed':is_reviewed,'rankScore':preference_rank,'deEmphasized':de_emphasized,'computedAt':i['computed_at'] if i else None})
        pulse={x:sum(s['tier']==x.title() for s in stocks) for x in ('significant','notable','normal')}
        order={'Significant':0,'Notable':1,'Normal':2}; catch=[s for s in stocks if not s['reviewed'] and not s['deEmphasized'] and s['tier']!='Normal'];catch.sort(key=lambda s:(order[s['tier']],-s['rankScore'],s['computedAt'] or ''))
        sectors={}
        for stock in stocks:
            if stock['price'] is not None:
                sectors.setdefault(stock['sector'],[]).append(stock['move'])
        context=[{'sector':sector,'move':sum(moves)/len(moves),'tracked':len(moves)} for sector,moves in sectors.items()]
        context.sort(key=lambda item:abs(item['move']),reverse=True)
        return {'demo':all(s['freshness'].startswith('Demo') for s in stocks if s['price'] is not None),'watchlist':stocks,'catchUp':catch[:5],'catchUpOverflow':max(0,len(catch)-5),'pulse':pulse,'marketContext':context,'baseline':None,'updated':'Cache-backed derived insights'}


if __name__ == "__main__":
    store.init()
    port = int(os.getenv("PORT", "8000"))
    print(f"Smart Market Watchlist listening on 0.0.0.0:{port} (set DATA_MODE=live and QUOTE_PROVIDER=yahoo for live quotes)")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
