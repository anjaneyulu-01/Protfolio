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

- `src/` React frontend (Vite)
- `server.js` Express backend
- `routes/`, `models/`, `services/` backend modules
- `scripts/` utility scripts (currently minimal)

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create a `.env` file in the repo root (it is ignored by git).

Use `.env.example` as the template:

```bash
copy .env.example .env
```

3) Start both frontend + backend:

```bash
npm run dev
```

Frontend runs on Vite (default `http://localhost:5173`).
Backend runs on the port from `PORT` in `.env`.

## Environment Variables

Backend reads config from `.env` via `dotenv`.

Important: any `VITE_...` variables are embedded into the frontend build and are visible in the browser. Do not put secrets in `VITE_...`.

Minimum required:

```env
ATLAS_DB_URL=mongodb+srv://<user>:<password>@<cluster>/<optionalDbOrParams>
PORTFOLIO_SECRET=<jwt_secret>
```

Commonly used:

```env
OWNER_EMAIL=<your admin email>
PORT=8005
NODE_ENV=development

# Cloudinary (uploads)
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

# Brevo (OTP email) - optional
BREVO_API_KEY=<key>
EMAIL_FROM=auth@new.tech
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

## Troubleshooting

- **Mongo error: `ATLAS_DB_URL environment variable is not set`**
  - Ensure `.env` exists in the project root and has `ATLAS_DB_URL=...`

- **CORS issues**
  - Backend currently allows localhost ports 5173/5174 in `server.js`.
