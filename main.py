from fastapi import FastAPI, Request, Response, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, Field, create_engine, Session, select
from sqlalchemy import Column
from sqlalchemy import JSON as SA_JSON
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import random
import smtplib
import ssl
from email.message import EmailMessage
from typing import Optional, List, Dict, Any
import os
import logging
import traceback

SECRET_KEY = os.environ.get('PORTFOLIO_SECRET', 'change-this-secret-for-prod')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Use PBKDF2 (no external bcrypt C-extension dependency) to avoid platform-specific bcrypt issues
pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')

DATABASE_URL = f"sqlite:///./portfolio.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI()

# configure simple logging for debugging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# Allow the frontend dev server origin and include credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory OTP store for dev: { email: { otp: '123456', expires_at: datetime, attempts: 0 } }
otp_store: Dict[str, Dict[str, Any]] = {}


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send OTP to email using SMTP settings from env. Returns True on success."""
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '0') or 0)
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    from_email = os.environ.get('FROM_EMAIL', smtp_user)
    if not smtp_host or not smtp_port or not smtp_user or not smtp_pass:
        # No SMTP configured — log and skip sending (dev fallback)
        logger.info("SMTP not configured, OTP for %s: %s", to_email, otp_code)
        return True
    try:
        msg = EmailMessage()
        msg['Subject'] = 'Your portfolio login OTP code'
        msg['From'] = from_email
        msg['To'] = to_email
        msg.set_content(f"Your login code is: {otp_code}\nThis code will expire in 5 minutes.")

        context = ssl.create_default_context()
        # Mailtrap (and most modern providers) prefer STARTTLS on ports 25/587/2525.
        # Use implicit SSL only when explicitly configured on port 465.
        if smtp_port == 465:
            # Implicit SSL
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            logger.info('OTP email sent to %s via SMTP_SSL', to_email)
        else:
            # Plain connection upgraded to TLS (STARTTLS)
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls(context=context)
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            logger.info('OTP email sent to %s via STARTTLS', to_email)
        return True
    except Exception:
        logger.error('Failed to send OTP email for %s', to_email)
        logger.error(traceback.format_exc())
        return False


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    hashed_password: str
    is_admin: bool = True


class Content(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    section: str
    slug: Optional[str] = None
    # Use a proper SQLAlchemy JSON column so SQLModel/SQLAlchemy can map dict values
    data: Optional[Dict[str, Any]] = Field(sa_column=Column(SA_JSON), default=None)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user_from_token(token: str, session: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    user = session.exec(select(User).where(User.email == email)).first()
    return user


def extract_token_from_request(request: Request):
    # Prefer cookie, but also accept Authorization: Bearer <token>
    token = request.cookies.get('access_token')
    if token:
        return token
    auth = request.headers.get('authorization')
    if auth and auth.lower().startswith('bearer '):
        return auth.split(' ', 1)[1].strip()
    return None


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Seed admin user if none
    with Session(engine) as session:
        existing = session.exec(select(User)).first()
        if not existing:
            # Default admin email (change via ADMIN_EMAIL env var in production)
            admin_email = os.environ.get('ADMIN_EMAIL', 'anjineyaluanji129@gmail.com')
            admin_pw = os.environ.get('ADMIN_PASSWORD', 'changeme')
            user = User(email=admin_email, hashed_password=get_password_hash(admin_pw), is_admin=True)
            session.add(user)
            session.commit()
            print(f"Created default admin: {admin_email} (change ADMIN_PASSWORD env var)")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get('/debug/echo')
def debug_echo(request: Request):
    # Development helper: returns request headers and cookies so we can verify
    # whether the browser is sending the auth cookie on requests.
    headers = {k: v for k, v in request.headers.items()}
    return {"cookies": dict(request.cookies), "headers": headers}


@app.get('/debug/otp')
def debug_otp(email: Optional[str] = None):
    """Dev-only: return the current OTP record for an email (if any).
    This is intended only for local development and testing when SMTP isn't
    configured and OTPs are printed to the server console.
    """
    if not email:
        raise HTTPException(status_code=400, detail='Missing email query param')
    rec = otp_store.get(email.lower())
    if not rec:
        return { 'found': False }
    return {
        'found': True,
        'otp': rec.get('otp'),
        'expires_at': rec.get('expires_at').isoformat() if rec.get('expires_at') else None,
        'attempts': rec.get('attempts', 0)
    }


@app.post('/auth/login')
def login(payload: Dict[str, str], response: Response):
    """Step 1: validate credentials and send OTP to the user's email. Returns otp_sent flag.
    The actual access token is issued after verifying the OTP at /auth/verify-otp.
    """
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        logger.info('Login attempt with missing credentials: email=%s', email)
        raise HTTPException(status_code=400, detail='Missing email or password')
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            logger.info('Login failed: user not found for email=%s', email)
            raise HTTPException(status_code=401, detail='Invalid credentials')
        if not verify_password(password, user.hashed_password):
            logger.info('Login failed: bad password for email=%s', email)
            raise HTTPException(status_code=401, detail='Invalid credentials')
        # generate OTP and store in memory for short time
        otp = f"{random.randint(0,999999):06d}"
        expires = datetime.utcnow() + timedelta(minutes=5)
        otp_store[email.lower()] = { 'otp': otp, 'expires_at': expires, 'attempts': 0 }
        sent = send_otp_email(email, otp)
        if not sent:
            # still return success but warn client
            return { "otp_sent": False, "message": 'OTP generation succeeded but failed to send email (check server logs).' }
        return { "otp_sent": True, "message": 'OTP sent to email' }


@app.post('/auth/logout')
def logout(response: Response):
    response.delete_cookie('access_token')
    return {"logged": False}


@app.post('/auth/verify-otp')
def verify_otp(payload: Dict[str, str], response: Response):
    """Verify OTP and issue JWT cookie on success."""
    email = (payload.get('email') or '').lower()
    otp = (payload.get('otp') or '').strip()
    if not email or not otp:
        raise HTTPException(status_code=400, detail='Missing email or otp')
    record = otp_store.get(email)
    if not record:
        raise HTTPException(status_code=400, detail='No OTP requested for this email')
    if datetime.utcnow() > record.get('expires_at'):
        otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail='OTP expired')
    if record.get('attempts', 0) >= 5:
        otp_store.pop(email, None)
        raise HTTPException(status_code=400, detail='Too many attempts')
    if otp != record.get('otp'):
        record['attempts'] = record.get('attempts', 0) + 1
        raise HTTPException(status_code=401, detail='Invalid OTP')
    # OTP valid -> create token for the user
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            raise HTTPException(status_code=404, detail='User not found')
        token = create_access_token({ 'sub': user.email })
        response.set_cookie(key='access_token', value=token, httponly=True, samesite='lax')
        # remove OTP record
        otp_store.pop(email, None)
        return { 'logged': True, 'email': user.email, 'token': token }


@app.post('/auth/resend-otp')
def resend_otp(payload: Dict[str, str]):
    email = (payload.get('email') or '').lower()
    if not email:
        raise HTTPException(status_code=400, detail='Missing email')
    # Only allow resend if a record exists (i.e., credentials were validated recently)
    record = otp_store.get(email)
    if not record:
        raise HTTPException(status_code=400, detail='No OTP request found; please login again')
    # generate new OTP
    otp = f"{random.randint(0,999999):06d}"
    expires = datetime.utcnow() + timedelta(minutes=5)
    otp_store[email] = { 'otp': otp, 'expires_at': expires, 'attempts': 0 }
    sent = send_otp_email(email, otp)
    if not sent:
        raise HTTPException(status_code=500, detail='Failed to send OTP email')
    return { 'otp_sent': True }


@app.get('/auth/status')
def status(request: Request):
    token = extract_token_from_request(request)
    if not token:
        return {"logged": False}
    with Session(engine) as session:
        user = get_current_user_from_token(token, session)
        if not user:
            return {"logged": False}
        return {"logged": True, "email": user.email}


# Content endpoints
@app.get('/content/{section}')
def get_section(section: str):
    with Session(engine) as session:
        items = session.exec(select(Content).where(Content.section == section)).all()
        return [ {"id": it.id, "slug": it.slug, "data": it.data, "created_at": it.created_at.isoformat()} for it in items ]


@app.post('/content/{section}')
def create_content(section: str, payload: Dict[str, Any], request: Request):
    # only admin
    token = extract_token_from_request(request)
    with Session(engine) as session:
        user = get_current_user_from_token(token, session)
        if not user or not user.is_admin:
            raise HTTPException(status_code=401, detail='Unauthorized')
        item = Content(section=section, slug=payload.get('slug'), data=payload.get('data'))
        session.add(item)
        session.commit()
        session.refresh(item)
        return {"id": item.id, "slug": item.slug, "data": item.data}


@app.put('/content/{item_id}')
def update_content(item_id: int, payload: Dict[str, Any], request: Request):
    token = extract_token_from_request(request)
    with Session(engine) as session:
        user = get_current_user_from_token(token, session)
        if not user or not user.is_admin:
            raise HTTPException(status_code=401, detail='Unauthorized')
        item = session.get(Content, item_id)
        if not item:
            raise HTTPException(status_code=404, detail='Not found')
        item.slug = payload.get('slug', item.slug)
        item.data = payload.get('data', item.data)
        session.add(item)
        session.commit()
        session.refresh(item)
        return {"id": item.id, "slug": item.slug, "data": item.data}


@app.delete('/content/{item_id}')
def delete_content(item_id: int, request: Request):
    token = extract_token_from_request(request)
    with Session(engine) as session:
        user = get_current_user_from_token(token, session)
        if not user or not user.is_admin:
            raise HTTPException(status_code=401, detail='Unauthorized')
        item = session.get(Content, item_id)
        if not item:
            raise HTTPException(status_code=404, detail='Not found')
        session.delete(item)
        session.commit()
        return {"ok": True}
