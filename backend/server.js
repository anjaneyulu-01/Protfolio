// ...existing code...
/**
 * Express.js Backend for AI Portfolio
 * Replaces Python FastAPI backend with identical functionality
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');  // Use bcryptjs (pure JS, works on all platforms)
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();

// CORS Configuration - Production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://anjaneyulu.onrender.com',        // Production frontend
  'https://protfolio-1-ca4b.onrender.com',  // Older production frontend
];

// Add FRONTEND_URL if set
if (process.env.FRONTEND_URL) {
  const frontendUrl = process.env.FRONTEND_URL.trim();
  if (!allowedOrigins.includes(frontendUrl)) {
    allowedOrigins.push(frontendUrl);
  }
}

console.log('🌐 Allowed CORS origins:', allowedOrigins);

// Use cors package with proper configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`);
      // Still allow but log it - don't block
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Environment variables
const SECRET_KEY = process.env.PORTFOLIO_SECRET || 'change-this-secret-for-prod';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 1 day
const MONGODB_URI = process.env.ATLAS_DB_URL;
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'anjaneyulu.dev01@gmail.com';

// MongoDB connection
let db = null;
let usersCollection = null;
let contentCollection = null;
let mongoConnected = false;

// Connect to MongoDB (don't crash if it fails)
async function connectToMongoDB() {
  if (!MONGODB_URI) {
    console.error('❌ ATLAS_DB_URL environment variable is not set');
    return false;
  }
  
  try {
    const mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db('portfolio');
    usersCollection = db.collection('users');
    contentCollection = db.collection('content');
    mongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    return false;
  }
}

// Start MongoDB connection (don't block server startup)
connectToMongoDB();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// OTP store (in-memory for development)
const otpStore = {};
const OTP_EXPIRE_MINUTES = 10;

// ========== AI ASSISTANT (ARIA) ==========
// Provider abstraction: uses whichever API key is present, else demo mode.
// Never hardcode keys — they come from backend/.env.
const OWNER_NAME = process.env.OWNER_NAME || 'Anjaneyulu';
const ASSISTANT_NAME = process.env.ASSISTANT_NAME || 'ARIA';

const ASSISTANT_SYSTEM_PROMPT = `You are ${ASSISTANT_NAME}, the friendly voice research assistant embedded in ${OWNER_NAME}'s AI Research Lab portfolio website. You represent ${OWNER_NAME} — the OWNER of this portfolio — and speak with recruiters and visitors like a warm, helpful phone-call assistant.

Rules:
- If asked "who is the owner / whose portfolio is this / who is ${OWNER_NAME} / who are you representing", answer clearly that this is ${OWNER_NAME}'s portfolio and give a one-line bio from the verified facts.
- Answer questions about ${OWNER_NAME}'s background, projects, skills, certificates, hackathons, events, workshops, education and how to get in touch USING ONLY the verified facts provided below.
- You MAY list items (certificates, hackathons, projects, etc.) when asked — keep each to a short phrase.
- Keep normal answers to 1-3 sentences since they are spoken aloud; when listing, stay brief and offer to go deeper.
- Be warm, confident and concise. Offer to explain a project or point them to a section.
- NEVER invent facts, credentials, dates, links or contact details. If something isn't in the verified facts, say you're not certain and offer what you do know.
- Avoid markdown symbols (no *, #, tables, or bullet dashes) — your reply is read ALOUD, so write natural spoken sentences.

AGENTIC NAVIGATION: This is a single-page site. When the visitor asks to see / show / open / go to a section, or when viewing a section would clearly help your answer (e.g. they ask about certificates, projects, skills, hackathons, workshops, about, or contact), take them there by appending a control tag as the VERY LAST thing in your reply, on its own: [[navigate:SECTION]] — where SECTION is exactly one of: home, about, skills, projects, certificates, hackathons, workshops, contact. Use at most ONE tag, and only when relevant. Never speak the tag or mention it; say something natural like "Let me take you there." first.`;

// Providers: primary (Groq OR xAI-Grok, auto-detected from the key) + Gemini fallback.
// A key starting with "xai-" targets xAI's Grok (api.x.ai); a "gsk_" key targets
// Groq (api.groq.com). Both are OpenAI-compatible. (OpenAI intentionally not used.)
function primaryKey() {
  return process.env.GROQ_API_KEY || process.env.XAI_API_KEY || '';
}
function primaryInfo() {
  const key = primaryKey();
  const isXai = key.startsWith('xai-');
  return {
    key,
    isXai,
    label: isXai ? 'grok' : 'groq',
    url: isXai ? 'https://api.x.ai/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions',
    model: isXai ? (process.env.XAI_MODEL || 'grok-3') : (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
  };
}
function pickProvider() {
  if (primaryKey()) return primaryInfo().label;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return 'demo';
}

// ---- Knowledge base: real data pulled from the portfolio DB (cached) ----
let kbCache = { text: '', ts: 0 };
const KB_TTL_MS = 5 * 60 * 1000;

async function buildKnowledgeBase() {
  if (!contentCollection) return kbCache.text;
  if (kbCache.text && Date.now() - kbCache.ts < KB_TTL_MS) return kbCache.text;
  try {
    const docs = await contentCollection.find({}).toArray();
    const bySection = {};
    for (const d of docs) (bySection[d.section || 'other'] ||= []).push(d.data || {});

    const clip = (v, n = 240) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
    const L = [];

    const about = bySection.about?.[0];
    if (about) {
      L.push(`WHO: This portfolio belongs to ${OWNER_NAME}. ${clip(about.description, 400)} ${clip(about.details, 300)}`.trim());
      if (Array.isArray(about.highlights) && about.highlights.length)
        L.push(`Highlights: ${about.highlights.join(', ')}.`);
    } else {
      L.push(`WHO: This portfolio belongs to ${OWNER_NAME}, an AI/ML and full-stack engineer.`);
    }

    if (bySection.skills?.length) {
      const byCat = {};
      for (const s of bySection.skills) (byCat[s.category || 'Skills'] ||= []).push(s.name);
      L.push('SKILLS — ' + Object.entries(byCat).map(([c, a]) => `${c}: ${a.filter(Boolean).join(', ')}`).join(' | '));
    }
    if (bySection.projects?.length) {
      L.push('PROJECTS:');
      bySection.projects.forEach((p) =>
        L.push(`- ${clip(p.title, 60)}${p.tech ? ` [${clip(p.tech, 60)}]` : ''}: ${clip(p.description, 200)}${p.liveLink || p.link ? ` (live: ${p.liveLink || p.link})` : ''}`)
      );
    }
    if (bySection.certificates?.length) {
      L.push('CERTIFICATES:');
      bySection.certificates.forEach((c) =>
        L.push(`- ${clip(c.title, 90)} — ${clip(c.issuer, 80)}${c.issueDate ? ` (${clip(c.issueDate, 30)})` : ''}`)
      );
    }
    if (bySection.hackathons?.length) {
      L.push('HACKATHONS & EVENTS:');
      bySection.hackathons.forEach((h) =>
        L.push(`- ${clip(h.title, 80)}${h.achievement ? ` — ${clip(h.achievement, 40)}` : ''}${h.date ? ` (${clip(h.date, 30)})` : ''}: ${clip(h.description, 170)}`)
      );
    }
    if (bySection.workshops?.length) {
      L.push('WORKSHOPS:');
      bySection.workshops.forEach((w) =>
        L.push(`- ${clip(w.title, 90)}${w.date ? ` (${clip(w.date, 30)})` : ''}${w.location ? ` @ ${clip(w.location, 50)}` : ''}: ${clip(w.description, 170)}`)
      );
    }
    L.push(`CONTACT: Reach ${OWNER_NAME} via the Contact section of the site${process.env.OWNER_EMAIL ? `, or email ${process.env.OWNER_EMAIL}` : ''}. A resume is available from the hero buttons.`);

    kbCache = { text: L.join('\n'), ts: Date.now() };
  } catch (e) {
    console.error('[assistant] KB build error:', e.message);
  }
  return kbCache.text;
}

function buildSystemContent(kb) {
  return (
    ASSISTANT_SYSTEM_PROMPT +
    (kb ? `\n\n=== VERIFIED FACTS ABOUT ${OWNER_NAME.toUpperCase()} (authoritative — use these, never contradict) ===\n${kb}` : '')
  );
}

async function callPrimary(systemContent, messages) {
  const p = primaryInfo();
  const body = {
    model: p.model,
    messages: [{ role: 'system', content: systemContent }, ...messages],
    max_tokens: 320,
    temperature: 0.5,
  };
  // gpt-oss models on Groq are reasoning models — keep latency low and answers
  // concise for the voice call (reasoning stays in a separate field, not spoken).
  if (/gpt-oss/i.test(p.model)) body.reasoning_effort = process.env.GROQ_REASONING_EFFORT || 'medium';
  const res = await axios.post(p.url, body, {
    headers: { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data?.choices?.[0]?.message?.content?.trim() || '';
}

async function callGemini(systemContent, messages) {
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      system_instruction: { parts: [{ text: systemContent }] },
      contents,
      // thinkingBudget:0 stops 2.5-family models from spending output tokens on
      // hidden reasoning (which otherwise returns empty text).
      generationConfig: { maxOutputTokens: 320, temperature: 0.5, thinkingConfig: { thinkingBudget: 0 } },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
  );
  const parts = res.data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text).filter(Boolean).join(' ').trim();
}

function demoReply(messages) {
  const last = (messages[messages.length - 1]?.content || '').toLowerCase();
  const has = (...w) => w.some((x) => last.includes(x));
  if (!last || has('hello', 'hi ', 'hey', 'how are you'))
    return `Hi! I'm ${ASSISTANT_NAME}, ${OWNER_NAME}'s research assistant. You can ask me about the projects, skills, or how to get in touch.`;
  if (has('project', 'tripsense', 'work', 'build'))
    return `${OWNER_NAME} builds AI-powered systems — the flagship is TripSense, an AI travel planner. Scroll to the Projects section and I can walk you through any of them.`;
  if (has('skill', 'tech', 'stack', 'language'))
    return `${OWNER_NAME} works across AI and machine learning, generative AI with RAG and agents, and full-stack MERN development. Want details on a specific area?`;
  if (has('contact', 'hire', 'email', 'reach', 'recruit'))
    return `You can reach ${OWNER_NAME} from the Contact section — there's email, LinkedIn, GitHub and a resume download. Shall I take you there?`;
  if (has('resume', 'cv'))
    return `You can view or download ${OWNER_NAME}'s resume from the hero buttons at the top. Would you like to know about a project first?`;
  return `Great question! I'm running in demo mode right now, but I can tell you about ${OWNER_NAME}'s projects, skills, hackathons, or how to get in touch. What would you like to explore?`;
}

const NAV_SECTIONS = ['home', 'about', 'skills', 'projects', 'certificates', 'hackathons', 'workshops', 'contact'];

// Pull a [[navigate:section]] control tag out of the model's reply and turn it
// into a structured action the frontend can execute. Also strips any stray tags.
function parseAction(reply) {
  if (!reply) return { text: reply, action: null };
  let action = null;
  const m = reply.match(/\[\[\s*navigate\s*:\s*([a-z]+)\s*\]\]/i);
  if (m && NAV_SECTIONS.includes(m[1].toLowerCase())) {
    action = { type: 'navigate', target: m[1].toLowerCase() };
  }
  const text = reply.replace(/\[\[.*?\]\]/g, '').replace(/\s{2,}/g, ' ').trim();
  return { text, action };
}

// Keyword fallback so demo mode (and any reply missing a tag) can still navigate.
// Fires whenever the user's message references a section topic — no action verb
// required (so "tell me about his certificates" also navigates).
function inferNavTarget(messages) {
  const last = (messages[messages.length - 1]?.content || '').toLowerCase();
  const map = [
    ['certificate', 'certificates'], ['certification', 'certificates'], ['credential', 'certificates'],
    ['project', 'projects'], ['built', 'projects'], ['tripsense', 'projects'], ['campuscode', 'projects'],
    ['skill', 'skills'], ['tech stack', 'skills'], ['technolog', 'skills'],
    ['hackathon', 'hackathons'], ['won', 'hackathons'], ['competition', 'hackathons'],
    ['workshop', 'workshops'], ['event', 'workshops'],
    ['contact', 'contact'], ['reach', 'contact'], ['hire', 'contact'], ['email', 'contact'], ['resume', 'contact'],
    ['about', 'about'], ['who is', 'about'], ['background', 'about'], ['education', 'about'],
  ];
  for (const [kw, sec] of map) if (last.includes(kw)) return { type: 'navigate', target: sec };
  return null;
}

async function generateAssistantReply(messages) {
  const systemContent = buildSystemContent(await buildKnowledgeBase());

  // Primary: Groq or xAI-Grok (auto-detected)
  if (primaryKey()) {
    const p = primaryInfo();
    try {
      const raw = await callPrimary(systemContent, messages);
      if (raw) {
        const { text, action } = parseAction(raw);
        return { reply: text, provider: p.label, model: p.model, action: action || inferNavTarget(messages) };
      }
    } catch (err) {
      console.error(`[assistant] ${p.label} error → falling back to gemini:`, err.response?.data?.error || err.response?.data || err.message);
    }
  }

  // Fallback: Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const raw = await callGemini(systemContent, messages);
      if (raw) {
        const { text, action } = parseAction(raw);
        return { reply: text, provider: 'gemini', action: action || inferNavTarget(messages) };
      }
    } catch (err) {
      console.error('[assistant] gemini error:', err.response?.data?.error || err.response?.data || err.message);
    }
  }

  // Last resort: local demo
  return { reply: demoReply(messages), provider: 'demo', action: inferNavTarget(messages) };
}

// ========== UTILITY FUNCTIONS ==========

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

function createAccessToken(data, expiresIn = `${ACCESS_TOKEN_EXPIRE_MINUTES}m`) {
  return jwt.sign(data, SECRET_KEY, { algorithm: ALGORITHM, expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  } catch (err) {
    return null;
  }
}

function extractTokenFromRequest(req) {
  // Try multiple sources for the token
  let token = req.cookies?.access_token || req.cookies?.accessToken;
  if (token) return token;
  
  // Try Authorization header
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth) {
    if (auth.toLowerCase().startsWith('bearer ')) {
      return auth.substring(7);
    }
    // If no Bearer prefix, assume it's the token itself
    return auth;
  }
  
  return null;
}

async function getCurrentUserFromToken(token) {
  if (!token) return null;
  const payload = verifyToken(token);
  const email = payload?.sub || payload?.email;
  if (!email) return null;
  
  try {
    const user = await usersCollection.findOne({ email });
    if (user) {
      // Normalize admin flag for both legacy (is_admin) and camelCase (isAdmin)
      user.is_admin = user.is_admin || user.isAdmin || user.email === OWNER_EMAIL;
    }
    return user;
  } catch (err) {
    return null;
  }
}

function isUserAdmin(user) {
  return Boolean(user && (user.is_admin || user.isAdmin || user.email === OWNER_EMAIL));
}

async function sendOtpEmail(userEmail, otpCode) {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'auth@newroots.tech';
    
    if (!brevoApiKey) {
      console.log(`🔐 OTP for ${userEmail}: ${otpCode}`);
      return true;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
          <h1>Your OTP Code</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hello,</p>
          <p>Your one-time password (OTP) for NewRoots is:</p>
          
          <div style="background: white; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px;">
            <h2 style="color: #667eea; letter-spacing: 5px; margin: 0;">${otpCode}</h2>
          </div>

          <p><strong>⏱️ This OTP is valid for 10 minutes only.</strong></p>
          
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">
            © 2026 NewRoots. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: emailFrom,
          name: 'NewRoots',
        },
        to: [{ email: userEmail }],
        subject: 'Your NewRoots OTP Code',
        htmlContent,
      },
      {
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`✅ OTP email sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err?.response?.data || err.message);
    return false;
  }
}

// ========== INITIALIZATION ==========

app.on('listening', async () => {
  console.log('🚀 Express server started on port 8000');
 
});

// ========== HEALTH & DEBUG ENDPOINTS ==========

app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'MongoDB Atlas' });
});

// ========== AI ASSISTANT ENDPOINTS ==========

app.get('/assistant/status', (req, res) => {
  const provider = pickProvider();
  const model = primaryKey() ? primaryInfo().model : (process.env.GEMINI_API_KEY ? (process.env.GEMINI_MODEL || 'gemini-flash-latest') : null);
  res.json({ provider, model, assistant: ASSISTANT_NAME, fallback: process.env.GEMINI_API_KEY ? 'gemini' : null });
});

app.post('/assistant/chat', async (req, res) => {
  try {
    let { messages } = req.body || {};
    if (!Array.isArray(messages)) messages = [];
    // keep only role/content, cap history for latency
    messages = messages
      .filter((m) => m && typeof m.content === 'string' && m.content.trim())
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1000) }))
      .slice(-16);

    if (messages.length === 0) {
      return res.json({ reply: `Hi! I'm ${ASSISTANT_NAME}. How can I help you?`, provider: pickProvider() });
    }

    const result = await generateAssistantReply(messages);
    res.json(result);
  } catch (err) {
    console.error('[assistant] route error:', err.message);
    res.status(200).json({ reply: "Sorry, I hit a snag — could you say that again?", provider: 'demo', error: true });
  }
});

app.get('/debug/echo', (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers
  });
});

app.get('/debug/otp', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ detail: 'Missing email query param' });
  }
  
  const record = otpStore[email.toLowerCase()];
  if (!record) {
    return res.json({ found: false });
  }
  
  res.json({
    found: true,
    otp: record.otp,
    expires_at: record.expires_at.toISOString(),
    attempts: record.attempts || 0
  });
});

// ========== AUTH ENDPOINTS ==========

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = (email || '').toLowerCase();
    
    if (!email || !password) {
      console.log(`⚠️  Login attempt with missing credentials: email=${email}`);
      return res.status(400).json({ detail: 'Missing email or password' });
    }
    
    const user = await usersCollection.findOne({ email: emailLower });
    if (!user) {
      console.log(`⚠️  Login failed: user not found for email=${email}`);
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    
    if (!verifyPassword(password, user.password)) {
      console.log(`⚠️  Login failed: bad password for email=${email}`);
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    if (!isUserAdmin(user)) {
      console.log(`⚠️  Login blocked: non-admin user attempted login for email=${email}`);
      return res.status(403).json({ detail: 'Admin access only' });
    }

    // Generate OTP for admin login
    const otp = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    otpStore[emailLower] = {
      otp,
      expires_at: expiresAt,
      attempts: 0,
      userId: user._id.toString(),
      email: user.email,
      isAdmin: isUserAdmin(user)
    };

    // Send OTP to owner email (fall back to user's email if OWNER_EMAIL missing)
    const targetEmail = OWNER_EMAIL || user.email;
    const sent = await sendOtpEmail(targetEmail, otp);

    if (!sent) {
      console.error('❌ Failed to send OTP email');
      return res.status(500).json({ detail: 'Failed to send OTP' });
    }

    console.log(`✅ OTP generated for ${emailLower}; expires at ${expiresAt.toISOString()}`);

    res.json({
      requiresOTPVerification: true,
      message: `OTP sent to owner email (${targetEmail}).` ,
      expires_in_minutes: OTP_EXPIRE_MINUTES
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('access_token');
  res.json({ logged: false });
});

app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailLower = (email || '').toLowerCase();
    const otpTrim = (otp || '').trim();
    
    if (!emailLower || !otpTrim) {
      return res.status(400).json({ detail: 'Missing email or otp' });
    }
    
    const record = otpStore[emailLower];
    if (!record) {
      return res.status(400).json({ detail: 'No OTP requested for this email' });
    }
    
    if (new Date() > record.expires_at) {
      delete otpStore[emailLower];
      return res.status(400).json({ detail: 'OTP expired' });
    }
    
    if ((record.attempts || 0) >= 5) {
      delete otpStore[emailLower];
      return res.status(400).json({ detail: 'Too many attempts' });
    }
    
    if (otpTrim !== record.otp) {
      record.attempts = (record.attempts || 0) + 1;
      return res.status(401).json({ detail: 'Invalid OTP' });
    }
    
    // OTP valid -> create token
    const user = await usersCollection.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    const token = createAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isAdmin: isUserAdmin(user),
      isVerified: true
    });
    
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000
    });
    
    delete otpStore[emailLower];
    
    res.json({
      logged: true,
      token,
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.post('/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = (email || '').toLowerCase();

    if (!emailLower) {
      return res.status(400).json({ detail: 'Email is required' });
    }

    const user = await usersCollection.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    if (!isUserAdmin(user)) {
      return res.status(403).json({ detail: 'Admin access only' });
    }

    const otp = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

    otpStore[emailLower] = {
      otp,
      expires_at: expiresAt,
      attempts: 0,
      userId: user._id.toString(),
      email: user.email,
      isAdmin: isUserAdmin(user)
    };

    const targetEmail = OWNER_EMAIL || user.email;
    const sent = await sendOtpEmail(targetEmail, otp);

    if (!sent) {
      return res.status(500).json({ detail: 'Failed to resend OTP' });
    }

    res.json({
      requiresOTPVerification: true,
      message: `OTP resent to owner email (${targetEmail}).`,
      expires_in_minutes: OTP_EXPIRE_MINUTES
    });
  } catch (err) {
    console.error('Error in resend-otp:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.get('/auth/check', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return res.json({ logged: false });
    }
    
    const user = await getCurrentUserFromToken(token);
    if (!user) {
      return res.json({ logged: false });
    }
    
    res.json({
      logged: true,
      email: user.email,
      is_admin: isUserAdmin(user)
    });
  } catch (err) {
    console.error('Error in auth check:', err);
    res.json({ logged: false });
  }
});

// ========== CONTENT MANAGEMENT ==========

app.get('/content/:section', async (req, res) => {
  try {
    const { section } = req.params;
    console.log(`📥 Fetching content for section: ${section}`);
    
    const items = await contentCollection
      .find({ section })
      .toArray();
    
    console.log(`✅ Found ${items.length} items for section: ${section}`);
    
    // Normalize shape: keep original data payload flattened and expose id
    const normalized = items.map((item) => {
      const payload = item.data || {};
      return {
        id: item._id.toString(),
        section: item.section,
        data: payload,
        pinned: item.pinned || false,
        pinnedOrder: item.pinnedOrder || 0,
        created_at: item.created_at,
        ...payload
      };
    });
    
    // Sort: pinned items first (by pinnedOrder), then by created_at
    normalized.sort((a, b) => {
      // Pinned items come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Among pinned items, sort by pinnedOrder (lower = first)
      if (a.pinned && b.pinned) {
        return (a.pinnedOrder || 0) - (b.pinnedOrder || 0);
      }
      
      // Non-pinned items: projects oldest first, others newest first
      const sortOrder = section === 'projects' ? 1 : -1;
      return sortOrder * (new Date(a.created_at) - new Date(b.created_at));
    });
    
    res.json(normalized);
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.get('/content/:section/:itemId', async (req, res) => {
  try {
    const { section, itemId } = req.params;
    
    if (!ObjectId.isValid(itemId)) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    
    const item = await contentCollection.findOne({
      _id: new ObjectId(itemId),
      section
    });
    
    if (!item) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    
    const payload = item.data || {};
    res.json({
      id: item._id.toString(),
      section: item.section,
      data: payload,
      ...payload
    });
  } catch (err) {
    console.error('Error fetching content item:', err);
    res.status(404).json({ detail: 'Item not found' });
  }
});

app.post('/content/:section', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    const user = token ? await getCurrentUserFromToken(token) : null;
    
    if (!isUserAdmin(user)) {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    
    const { section } = req.params;
    const payload = req.body;
    
    const doc = {
      section,
      slug: payload.slug,
      data: payload,
      created_at: new Date()
    };
    
    const result = await contentCollection.insertOne(doc);
    
    res.json({
      id: result.insertedId.toString(),
      message: 'Created successfully'
    });
  } catch (err) {
    console.error('Error creating content:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.put('/content/:section/:itemId', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    const user = token ? await getCurrentUserFromToken(token) : null;
    
    if (!isUserAdmin(user)) {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    
    const { section, itemId } = req.params;
    
    if (!ObjectId.isValid(itemId)) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    
    const payload = req.body;
    
    const result = await contentCollection.updateOne(
      {
        _id: new ObjectId(itemId),
        section
      },
      {
        $set: {
          data: payload,
          updated_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('Error updating content:', err);
    res.status(500).json({ detail: err.message });
  }
});

// ========== PIN/UNPIN CONTENT ==========

app.put('/content/:section/:itemId/pin', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    const user = token ? await getCurrentUserFromToken(token) : null;

    if (!isUserAdmin(user)) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const { section, itemId } = req.params;
    const { pinned, order } = req.body;

    if (!ObjectId.isValid(itemId)) {
      return res.status(404).json({ detail: 'Item not found' });
    }

    // Get current item
    const item = await contentCollection.findOne({
      _id: new ObjectId(itemId),
      section
    });

    if (!item) {
      return res.status(404).json({ detail: 'Item not found' });
    }

    if (pinned) {
      // Load all other pinned items in this section, in their current priority order
      const otherPinned = await contentCollection
        .find({ section, pinned: true, _id: { $ne: item._id } })
        .sort({ pinnedOrder: 1 })
        .toArray();

      // If an explicit priority (1 = top) was given, insert there and push the rest
      // down. Otherwise append to the end of the pinned list (default pin behavior).
      const requestedOrder = Number(order);
      const insertIndex = Number.isFinite(requestedOrder) && requestedOrder >= 1
        ? Math.min(Math.trunc(requestedOrder) - 1, otherPinned.length)
        : otherPinned.length;

      otherPinned.splice(insertIndex, 0, item);

      const bulkOps = otherPinned.map((doc, idx) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { pinned: true, pinnedOrder: idx + 1, updated_at: new Date() } }
        }
      }));

      await contentCollection.bulkWrite(bulkOps);

      const finalOrder = insertIndex + 1;
      console.log(`📌 Pinned item ${itemId} in section ${section} at position ${finalOrder}`);
      res.json({ message: 'Pinned successfully', pinned: true, pinnedOrder: finalOrder });
    } else {
      await contentCollection.updateOne(
        { _id: item._id },
        { $set: { pinned: false, pinnedOrder: 0, updated_at: new Date() } }
      );

      // Re-sequence remaining pinned items so priorities stay contiguous (1, 2, 3, ...)
      const remainingPinned = await contentCollection
        .find({ section, pinned: true })
        .sort({ pinnedOrder: 1 })
        .toArray();

      const bulkOps = remainingPinned.map((doc, idx) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { pinnedOrder: idx + 1, updated_at: new Date() } }
        }
      }));

      if (bulkOps.length > 0) {
        await contentCollection.bulkWrite(bulkOps);
      }

      console.log(`📌 Unpinned item ${itemId} in section ${section}`);
      res.json({ message: 'Unpinned successfully', pinned: false, pinnedOrder: 0 });
    }
  } catch (err) {
    console.error('Error toggling pin:', err);
    res.status(500).json({ detail: err.message });
  }
});

// Reorder pinned items
app.put('/content/:section/reorder-pins', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    const user = token ? await getCurrentUserFromToken(token) : null;
    
    if (!isUserAdmin(user)) {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    
    const { section } = req.params;
    const { orderedIds } = req.body; // Array of item IDs in desired order
    
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ detail: 'orderedIds must be an array' });
    }
    
    // Update each item's pinnedOrder based on its position in the array
    const updatePromises = orderedIds.map((id, index) => {
      if (!ObjectId.isValid(id)) return Promise.resolve();
      
      return contentCollection.updateOne(
        { _id: new ObjectId(id), section },
        { $set: { pinnedOrder: index + 1, updated_at: new Date() } }
      );
    });
    
    await Promise.all(updatePromises);
    
    console.log(`📌 Reordered pins in section ${section}`);
    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    console.error('Error reordering pins:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.delete('/content/:section/:itemId', async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    const user = token ? await getCurrentUserFromToken(token) : null;
    
    if (!isUserAdmin(user)) {
      return res.status(403).json({ detail: 'Not authorized' });
    }
    
    const { section, itemId } = req.params;
    
    if (!ObjectId.isValid(itemId)) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    
    const result = await contentCollection.deleteOne({
      _id: new ObjectId(itemId),
      section
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error deleting content:', err);
    res.status(500).json({ detail: err.message });
  }
});

// ========== IMAGE UPLOAD ==========

app.post('/upload-image', upload.single('file'), async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    
    // Check if user is authenticated (not necessarily admin)
    if (!token) {
      console.error('❌ Upload rejected: No token');
      return res.status(403).json({ detail: 'Not authenticated. Please login first.' });
    }
    
    const user = await getCurrentUserFromToken(token);
    if (!user) {
      console.error('❌ Upload rejected: Invalid token');
      return res.status(403).json({ detail: 'Invalid or expired token' });
    }
    
    if (!req.file) {
      console.error('❌ Upload rejected: No file provided');
      return res.status(400).json({ detail: 'No file uploaded' });
    }
    
    console.log(`📤 Uploading image for user: ${user.email}, File: ${req.file.originalname}, Size: ${req.file.size} bytes`);
    
    // Upload to Cloudinary using a Promise wrapper
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            res.status(500).json({ detail: `Upload failed: ${error.message}` });
            reject(error);
          } else {
            console.log(`✅ Image uploaded successfully: ${result.secure_url}`);
            res.json({
              url: result.secure_url,
              public_id: result.public_id
            });
            resolve(result);
          }
        }
      );
      
      // Pipe the buffer to Cloudinary
      const stream = require('stream');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);
      bufferStream.pipe(uploadStream);
      
      uploadStream.on('error', (err) => {
        console.error('❌ Stream error during upload:', err);
        if (!res.headersSent) {
          res.status(500).json({ detail: `Upload failed: ${err.message}` });
        }
        reject(err);
      });
    });
    
  } catch (err) {
    console.error('❌ Image upload error:', err);
    if (!res.headersSent) {
      res.status(500).json({ detail: `Upload failed: ${err.message}` });
    }
  }
});

// ========== RESUME UPLOAD (ADMIN ONLY) ==========
app.post('/upload/resume', upload.single('resume'), async (req, res) => {
  try {
    // Check authentication and admin
    const token = extractTokenFromRequest(req);
    if (!token) {
      return res.status(403).json({ detail: 'Not authenticated. Please login first.' });
    }
    const user = await getCurrentUserFromToken(token);
    if (!user || !isUserAdmin(user)) {
      return res.status(403).json({ detail: 'Admin access only.' });
    }
    // Check file
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded.' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ detail: 'Only PDF files are allowed.' });
    }
    // Upload PDF to Cloudinary as raw file
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);
    cloudinary.uploader.upload_stream(
      {
        folder: 'portfolio',
        resource_type: 'raw',
        public_id: 'resume', // always overwrite the same resume
        overwrite: true
      },
      async (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          return res.status(500).json({ detail: `Upload failed: ${error.message}` });
        }

        // Persist the latest resume URL (so View/Download always works)
        try {
          await contentCollection.updateOne(
            { section: 'settings', slug: 'resume' },
            {
              $set: {
                section: 'settings',
                slug: 'resume',
                data: {
                  url: result.secure_url,
                  public_id: result.public_id,
                  updated_at: new Date()
                },
                updated_at: new Date()
              },
              $setOnInsert: { created_at: new Date() }
            },
            { upsert: true }
          );
        } catch (dbErr) {
          console.error('❌ Failed to persist resume URL:', dbErr);
          // Still return success because the file is uploaded to Cloudinary
        }

        res.json({ message: 'Resume uploaded successfully.', url: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (err) {
    console.error('❌ Resume upload error:', err);
    res.status(500).json({ detail: 'Failed to upload resume.' });
  }
});

// ========== RESUME VIEW/DOWNLOAD ==========

app.get('/resume-url', async (req, res) => {
  try {
    const doc = await contentCollection.findOne({ section: 'settings', slug: 'resume' });
    const url = doc?.data?.url;

    if (url) {
      return res.json({ url });
    }

    // Fallback to local file if present (public/resume.pdf)
    const localPath = path.join(__dirname, 'public', 'resume.pdf');
    if (fs.existsSync(localPath)) {
      return res.json({ url: '/resume.pdf', source: 'local' });
    }

    return res.status(404).json({ detail: 'Resume not found.' });
  } catch (err) {
    console.error('❌ Resume URL error:', err);
    return res.status(500).json({ detail: 'Failed to get resume url.' });
  }
});

// View in browser (streams PDF with inline headers)
app.get('/resume', async (req, res) => {
  try {
    const doc = await contentCollection.findOne({ section: 'settings', slug: 'resume' });
    const url = doc?.data?.url;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');

    if (url) {
      const response = await axios.get(url, { responseType: 'stream' });
      return response.data.pipe(res);
    }

    const localPath = path.join(__dirname, 'public', 'resume.pdf');
    if (fs.existsSync(localPath)) {
      return fs.createReadStream(localPath).pipe(res);
    }

    return res.status(404).send('Resume not found');
  } catch (err) {
    console.error('❌ Resume view error:', err);
    return res.status(500).send('Failed to load resume');
  }
});

// Force download (streams the PDF so the browser downloads it)
app.get('/resume/download', async (req, res) => {
  try {
    const doc = await contentCollection.findOne({ section: 'settings', slug: 'resume' });
    const url = doc?.data?.url;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');

    if (url) {
      const response = await axios.get(url, { responseType: 'stream' });
      return response.data.pipe(res);
    }

    const localPath = path.join(__dirname, 'public', 'resume.pdf');
    if (fs.existsSync(localPath)) {
      return fs.createReadStream(localPath).pipe(res);
    }

    return res.status(404).send('Resume not found');
  } catch (err) {
    console.error('❌ Resume download error:', err);
    return res.status(500).send('Failed to download resume');
  }
});

// ========== START SERVER ==========

// Health check endpoint (doesn't require DB)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoConnected ? 'connected' : 'disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Portfolio API', 
    status: 'running',
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    endpoints: ['/health', '/auth/check', '/content/:section']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ detail: 'Internal server error' });
});

const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✨ Express.js Backend running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
