# Portfolio (MERN)

Full-stack MERN portfolio app:
- **Frontend:** React + Vite + Tailwind
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (MongoDB driver)
- **Uploads:** Cloudinary
- **Auth:** JWT (cookie + Bearer supported)
- **Email/OTP:** Brevo (optional; falls back to console OTP)

## Requirements

- Node.js **18+**
- npm **9+**
- A MongoDB Atlas connection string

## Project Structure (high-level)

```
.
├── package.json        # root runner (concurrently → runs both)
├── frontend/           # React + Vite + Tailwind
│   ├── index.html
│   ├── vite.config.js · tailwind.config.js · postcss.config.js
│   ├── src/            # React app
│   ├── public/
│   └── .env            # VITE_* (public) vars
└── backend/            # Node.js + Express API
    ├── server.js
    ├── routes/ · models/ · services/
    ├── public/         # resume.pdf fallback
    └── .env            # backend secrets
```

## Setup

1) Install dependencies for root + both apps:

```bash
npm run install:all
```

(or individually: `npm install`, `npm --prefix frontend install`, `npm --prefix backend install`)

2) Create the two `.env` files (both ignored by git), using the
`.env.example` in each folder as the template:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

3) Start both frontend + backend from the repo root:

```bash
npm run dev
```

Frontend runs on Vite (default `http://localhost:5173`).
Backend runs on the port from `PORT` in `backend/.env`.

## Environment Variables

Backend reads config from `backend/.env` via `dotenv`. Frontend `VITE_*`
vars live in `frontend/.env` and are read by Vite.

Important: any `VITE_...` variables are embedded into the frontend build and are visible in the browser. Do not put secrets in `VITE_...`.

Minimum required:

```env
ATLAS_DB_URL=mongodb+srv://<user>:<password>@<cluster>/<optionalDbOrParams>
PORTFOLIO_SECRET=<jwt_secret>
```

Commonly used:

```env
OWNER_EMAIL=<your admin email>
NODE_ENV=development

# Cloudinary (uploads)
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

# Brevo (OTP email) - optional
BREVO_API_KEY=<key>
EMAIL_FROM=auth@new.tech
```

Frontend (Vite):

```env
VITE_API_URL=http://127.0.0.1:8005
```

Notes:
- If `BREVO_API_KEY` is missing, OTP codes are logged to the server console.
- `OWNER_EMAIL` is treated as admin in the backend.

## Database

The backend connects to MongoDB using `ATLAS_DB_URL` and uses the database name `portfolio` (see `server.js`).
Collections used include `users`, `content`, and feature-specific collections.

### Admin User

An admin user record already exists in your database (`portfolio.users`) and the password stored is **bcrypt-hashed** (not plaintext).

## Security Notes (Important)

This repo previously included a `scripts/seed.js` file with hard-coded credentials. It has been removed.

Recommended practices:
- Never commit real secrets to the repo.
- Keep `.env` local only (it’s already in `.gitignore`).
- Rotate credentials if they were ever pushed/shared publicly.

## Scripts

- `npm run dev` – run frontend + backend concurrently
- `npm run dev:frontend` – run Vite frontend
- `npm run dev:backend` – run backend with nodemon
- `npm run start` / `npm run server` – run backend

## Deploy on Render (Recommended)

Use **two services**:

1) **Backend** as a Render **Web Service**
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Set env vars: `ATLAS_DB_URL`, `PORTFOLIO_SECRET`, `OWNER_EMAIL`, Cloudinary vars, Brevo vars (optional)
- Set `FRONTEND_URL` to your deployed frontend URL so CORS allows it
- Do **not** set `PORT` on Render (Render injects it)

2) **Frontend** as a Render **Static Site**
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Set env var: `VITE_API_URL` to your backend URL (example: `https://your-backend.onrender.com`)

## Troubleshooting

- **Mongo error: `ATLAS_DB_URL environment variable is not set`**
  - Ensure `backend/.env` exists and has `ATLAS_DB_URL=...`

- **CORS issues**
  - Backend currently allows localhost ports 5173/5174 in `server.js`.
