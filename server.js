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
  'https://protfolio-1-ca4b.onrender.com',  // Production frontend (hardcoded)
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
    const { pinned } = req.body;
    
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
    
    let pinnedOrder = 0;
    
    if (pinned) {
      // Find the highest pinnedOrder in this section and add 1
      const maxPinnedItem = await contentCollection
        .find({ section, pinned: true })
        .sort({ pinnedOrder: -1 })
        .limit(1)
        .toArray();
      
      pinnedOrder = maxPinnedItem.length > 0 ? (maxPinnedItem[0].pinnedOrder || 0) + 1 : 1;
    }
    
    const result = await contentCollection.updateOne(
      {
        _id: new ObjectId(itemId),
        section
      },
      {
        $set: {
          pinned: pinned,
          pinnedOrder: pinned ? pinnedOrder : 0,
          updated_at: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    
    console.log(`📌 ${pinned ? 'Pinned' : 'Unpinned'} item ${itemId} in section ${section}`);
    res.json({ 
      message: pinned ? 'Pinned successfully' : 'Unpinned successfully',
      pinned,
      pinnedOrder: pinned ? pinnedOrder : 0
    });
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
