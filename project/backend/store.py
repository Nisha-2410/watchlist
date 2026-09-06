"""SQLite persistence for local development; production can replace this repository boundary."""
import sqlite3, hashlib, secrets, hmac
from pathlib import Path
from datetime import datetime, timezone

# Render's default filesystem is ephemeral: this database resets on restart or
# redeploy unless the application directory is backed by an attached persistent disk.
DB = Path(__file__).with_name("watchlist.db")
def now(): return datetime.now(timezone.utc).isoformat()
def con():
    c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; c.execute("PRAGMA foreign_keys=ON"); return c
def init():
    c=con(); c.executescript('''
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS securities(symbol TEXT PRIMARY KEY,name TEXT NOT NULL,exchange TEXT NOT NULL,sector TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS watch_entries(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),symbol TEXT NOT NULL REFERENCES securities(symbol),watch_type TEXT NOT NULL DEFAULT 'permanent',expires_at TEXT,threshold REAL,mute INTEGER NOT NULL DEFAULT 0,added_at TEXT NOT NULL, UNIQUE(user_id,symbol));
CREATE TABLE IF NOT EXISTS acknowledgements(user_id INTEGER NOT NULL,event_key TEXT NOT NULL,acknowledged_at TEXT NOT NULL,PRIMARY KEY(user_id,event_key));
CREATE TABLE IF NOT EXISTS preferences(user_id INTEGER PRIMARY KEY REFERENCES users(id),price INTEGER DEFAULT 1,volume INTEGER DEFAULT 1,news INTEGER DEFAULT 1,earnings INTEGER DEFAULT 1,corporate_actions INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS muted_categories(user_id INTEGER NOT NULL REFERENCES users(id),category TEXT NOT NULL,PRIMARY KEY(user_id,category));
CREATE TABLE IF NOT EXISTS market_snapshots(id INTEGER PRIMARY KEY,symbol TEXT NOT NULL REFERENCES securities(symbol),timestamp TEXT NOT NULL,price REAL NOT NULL,volume REAL,source TEXT NOT NULL,UNIQUE(symbol,timestamp,source));
CREATE TABLE IF NOT EXISTS market_events(id INTEGER PRIMARY KEY,symbol TEXT,layer TEXT NOT NULL,category TEXT NOT NULL,title TEXT NOT NULL,detail TEXT,source TEXT,timestamp TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active');
CREATE TABLE IF NOT EXISTS derived_insights(symbol TEXT PRIMARY KEY,computed_at TEXT NOT NULL,baseline_price REAL,current_price REAL,tier TEXT NOT NULL,confidence TEXT NOT NULL,rank_score REAL NOT NULL,signals_json TEXT NOT NULL,evidence_json TEXT NOT NULL,model_version TEXT NOT NULL,freshness TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS event_threads(id INTEGER PRIMARY KEY,symbol TEXT NOT NULL,category TEXT NOT NULL,status TEXT NOT NULL,opened_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS thread_events(thread_id INTEGER NOT NULL REFERENCES event_threads(id),event_id INTEGER NOT NULL REFERENCES market_events(id),PRIMARY KEY(thread_id,event_id));
CREATE TABLE IF NOT EXISTS sector_benchmarks(sector TEXT PRIMARY KEY,benchmark_symbol TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS peer_relationships(symbol TEXT NOT NULL REFERENCES securities(symbol),peer_symbol TEXT NOT NULL REFERENCES securities(symbol),PRIMARY KEY(symbol,peer_symbol));
CREATE TABLE IF NOT EXISTS provider_health(provider TEXT NOT NULL,kind TEXT NOT NULL,symbol TEXT NOT NULL,last_success_at TEXT,last_error_at TEXT,last_error TEXT,consecutive_failures INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(provider,kind,symbol));
CREATE TABLE IF NOT EXISTS provider_budgets(provider TEXT PRIMARY KEY,window_started TEXT NOT NULL,call_count INTEGER NOT NULL,cooldown_until TEXT);
CREATE TABLE IF NOT EXISTS provider_cache(cache_key TEXT PRIMARY KEY,value_json TEXT NOT NULL,refreshed_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS catalog_refresh_state(id INTEGER PRIMARY KEY CHECK(id=1),last_symbol TEXT,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
'''); c.executemany("INSERT OR IGNORE INTO securities VALUES(?,?,?,?)",[("AAPL","Apple Inc.","NASDAQ","Technology"),("MSFT","Microsoft Corp.","NASDAQ","Technology"),("NVDA","NVIDIA Corp.","NASDAQ","Semiconductors"),("RELIANCE.NS","Reliance Industries","NSE","Energy"),("INFY.NS","Infosys","NSE","Technology"),("HDFCBANK.NS","HDFC Bank","NSE","Banking")]);
    c.executemany("INSERT OR IGNORE INTO sector_benchmarks VALUES(?,?)",[("Technology","MSFT"),("Semiconductors","NVDA"),("Energy","RELIANCE.NS"),("Banking","HDFCBANK.NS")])
    c.executemany("INSERT OR IGNORE INTO peer_relationships VALUES(?,?)",[("AAPL","MSFT"),("AAPL","NVDA"),("MSFT","AAPL"),("MSFT","NVDA"),("NVDA","AAPL"),("NVDA","MSFT"),("INFY.NS","HDFCBANK.NS"),("HDFCBANK.NS","INFY.NS"),("RELIANCE.NS","HDFCBANK.NS")])
    c.execute("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(?,?)",(1,now())); c.commit();c.close()

def password_hash(password):
    """Store a salted, deliberately expensive verifier without a third-party dependency."""
    salt=secrets.token_bytes(16); digest=hashlib.scrypt(password.encode(),salt=salt,n=2**14,r=8,p=1)
    return f"scrypt$16384$8$1${salt.hex()}${digest.hex()}"

def password_matches(password, encoded):
    # One-time compatibility path for local databases created before salted hashes.
    if not encoded.startswith("scrypt$"):
        return hmac.compare_digest(encoded,hashlib.sha256(password.encode()).hexdigest())
    _,n,r,p,salt,digest=encoded.split("$")
    candidate=hashlib.scrypt(password.encode(),salt=bytes.fromhex(salt),n=int(n),r=int(r),p=int(p)).hex()
    return hmac.compare_digest(candidate,digest)
def signup(email,password):
    c=con(); h=password_hash(password)
    try: c.execute("INSERT INTO users(email,password_hash,created_at) VALUES(?,?,?)",(email.lower(),h,now())); uid=c.execute("SELECT id FROM users WHERE email=?",(email.lower(),)).fetchone()[0];c.execute("INSERT INTO preferences(user_id) VALUES(?)",(uid,));c.commit()
    except sqlite3.IntegrityError: raise ValueError("An account with that email already exists")
    return session(c,uid)
def login(email,password):
    c=con(); row=c.execute("SELECT id,password_hash FROM users WHERE email=?",(email.lower(),)).fetchone()
    if row and password_matches(password,row['password_hash']) and not row['password_hash'].startswith('scrypt$'):
        c.execute("UPDATE users SET password_hash=? WHERE id=?",(password_hash(password),row['id'])); c.commit()
    if not row or not password_matches(password,row['password_hash']): raise ValueError("Invalid email or password")
    return session(c,row[0])
def session(c,uid):
    token=secrets.token_urlsafe(32);c.execute("INSERT INTO sessions VALUES(?,?,?)",(token,uid,now()));c.commit();return token
def user(token):
    c=con();row=c.execute("SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=?",(token,)).fetchone();c.close();return row
