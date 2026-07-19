// API base URL.
// - Local dev: set VITE_API_URL=https://anjaneyulu1.onrender.com in frontend/.env
// - Production: set VITE_API_URL to the backend URL in Render (build env var).
// The fallback below points at the deployed backend so production builds work
// even if VITE_API_URL isn't set at build time.
export const API_BASE = import.meta.env.VITE_API_URL || 'https://anjaneyulu1.onrender.com';
