#!/usr/bin/env python3
"""
Update the first admin user's email and/or password in the local SQLite DB.
Usage (PowerShell):
    & .venv/Scripts/python.exe ./scripts/update_admin.py new_email new_password
Or set NEW_ADMIN_EMAIL and NEW_ADMIN_PASSWORD env vars before running and omit args.

This script uses the same hashing function as the app so passwords remain compatible.
"""
import os
import sys
from sqlmodel import Session, select

# Import helpers and models from main
import sys
import os as _os
# Ensure the project root is on sys.path so we can import main when running from scripts/
sys.path.insert(0, _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '..')))
import main

def main_update(email: str, password: str):
    with Session(main.engine) as session:
        user = session.exec(select(main.User)).first()
        if not user:
            print("No user found in DB. Nothing to update.")
            return
        print(f"Current user: {user.email}")
        if email:
            print(f"Updating email -> {email}")
            user.email = email
        if password:
            print("Updating password -> (hidden)")
            user.hashed_password = main.get_password_hash(password)
        session.add(user)
        session.commit()
        print("Update complete.")

if __name__ == '__main__':
    new_email = None
    new_password = None
    if len(sys.argv) >= 2:
        new_email = sys.argv[1]
    if len(sys.argv) >= 3:
        new_password = sys.argv[2]
    # env var fallback
    if not new_email:
        new_email = os.environ.get('NEW_ADMIN_EMAIL')
    if not new_password:
        new_password = os.environ.get('NEW_ADMIN_PASSWORD')
    if not new_email and not new_password:
        print("Provide new email and/or new password as args or set NEW_ADMIN_EMAIL/NEW_ADMIN_PASSWORD env vars.")
        print("Example: & .venv/Scripts/python.exe ./scripts/update_admin.py anjineyaluanji129@gmail.com strongpw123")
        sys.exit(1)
    main_update(new_email, new_password)
