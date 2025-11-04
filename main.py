from fastapi import FastAPI, Request, Response, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, Field, create_engine, Session, select
from sqlalchemy import Column
from sqlalchemy import JSON as SA_JSON
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import os

SECRET_KEY = os.environ.get('PORTFOLIO_SECRET', 'change-this-secret-for-prod')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Use PBKDF2 (no external bcrypt C-extension dependency) to avoid platform-specific bcrypt issues
pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')

DATABASE_URL = f"sqlite:///./portfolio.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI()

# Allow the frontend dev server origin and include credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
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


@app.post('/auth/login')
def login(payload: Dict[str, str], response: Response):
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail='Missing email or password')
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail='Invalid credentials')
        token = create_access_token({"sub": user.email})
        # Set HttpOnly cookie
        response.set_cookie(key='access_token', value=token, httponly=True, samesite='lax')
        # Also return token in body for clients that prefer Authorization header (fallback)
        return {"logged": True, "email": user.email, "token": token}


@app.post('/auth/logout')
def logout(response: Response):
    response.delete_cookie('access_token')
    return {"logged": False}


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
