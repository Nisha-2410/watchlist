"""Import licensed reference data from CSV; it deliberately does not fetch unlicensed data."""
import argparse
import csv
from backend import store

def import_csv(path):
    store.init(); c = store.con()
    try:
        with open(path, newline='', encoding='utf-8-sig') as file:
            rows = list(csv.DictReader(file))
            # Insert the complete security catalog first. Peer relationships have
            # foreign keys on both ends, and a peer may appear later in the CSV.
            for row in rows:
                c.execute("INSERT INTO securities(symbol,name,exchange,sector) VALUES(?,?,?,?) ON CONFLICT(symbol) DO UPDATE SET name=excluded.name,exchange=excluded.exchange,sector=excluded.sector", (row['symbol'].upper(),row['name'],row['exchange'],row['sector']))
            for row in rows:
                if row.get('benchmark_symbol'): c.execute("INSERT INTO sector_benchmarks(sector,benchmark_symbol) VALUES(?,?) ON CONFLICT(sector) DO UPDATE SET benchmark_symbol=excluded.benchmark_symbol",(row['sector'],row['benchmark_symbol'].upper()))
                for peer in filter(None,(row.get('peers') or '').upper().split('|')): c.execute("INSERT OR IGNORE INTO peer_relationships(symbol,peer_symbol) VALUES(?,?)",(row['symbol'].upper(),peer))
        c.commit()
    finally: c.close()

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description='Import symbol,name,exchange,sector,benchmark_symbol,peers CSV'); parser.add_argument('csv_path'); import_csv(parser.parse_args().csv_path)
