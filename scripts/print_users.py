from pathlib import Path
import sys
import sqlite3

db = Path('portfolio.db')
if not db.exists():
    print('No DB found at portfolio.db')
    sys.exit(0)

conn = sqlite3.connect('portfolio.db')
cur = conn.cursor()
try:
    cur.execute('SELECT id, email, is_admin FROM User')
    rows = cur.fetchall()
    for r in rows:
        print(r)
except Exception as e:
    print('Error reading users:', e)
finally:
    conn.close()
