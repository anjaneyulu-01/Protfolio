/**
 * Express.js Backend for AI Portfolio
 * Replaces Python FastAPI backend with identical functionality
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Environment variables
const SECRET_KEY = process.env.PORTFOLIO_SECRET || 'change-this-secret-for-prod';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 1 day
const MONGODB_URI = process.env.ATLAS_DB_URL;
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'anjaneyulu.dev01@gmail.com';

if (!MONGODB_URI) {
  throw new Error('ATLAS_DB_URL environment variable is not set');
}

// MongoDB connection
let db = null;
let usersCollection = null;
let contentCollection = null;

const mongoClient = new MongoClient(MONGODB_URI);

// Connect to MongoDB
mongoClient.connect().then(() => {
  db = mongoClient.db('portfolio');
  usersCollection = db.collection('users');
  contentCollection = db.collection('content');
  console.log('✅ Connected to MongoDB Atlas');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

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
  
  // NOTE: Admin user is now seeded via scripts/seed.js
  // This section is kept for backward compatibility only
});

// ========== HEALTH & DEBUG ENDPOINTS ==========

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
    
    if (!email || !password) {
      console.log(`⚠️  Login attempt with missing credentials: email=${email}`);
      return res.status(400).json({ detail: 'Missing email or password' });
    }
    
    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.log(`⚠️  Login failed: user not found for email=${email}`);
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    
    if (!verifyPassword(password, user.password)) {
      console.log(`⚠️  Login failed: bad password for email=${email}`);
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    
    /* OTP AUTHENTICATION - DISABLED FOR NOW (Will enable at project completion)
    // Generate OTP
    const otp = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    otpStore[email.toLowerCase()] = {
      otp,
      expires_at: expiresAt,
      attempts: 0
    };
    
    // Send OTP email asynchronously
    sendOtpEmail(email, otp).catch(err => console.error('Error sending OTP:', err));
    
    res.json({
      otp_sent: true,
      message: 'OTP sent to owner email (check spam folder).'
    });
    */
    
    // TEMPORARILY BYPASS OTP - Create token directly after credential verification
    const token = createAccessToken({
      userId: user._id.toString(),
      email: user.email,
      isAdmin: isUserAdmin(user),
      isVerified: true // Mark as verified to bypass email verification middleware
    });
    
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    console.log(`✅ User logged in successfully: ${email}`);
    res.json({
      success: true,
      token,
      message: 'Logged in successfully'
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
    
    const token = createAccessToken({ sub: user.email });
    
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000
    });
    
    delete otpStore[emailLower];
    
    res.json({
      logged: true,
      token
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
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
    
    // Different sort order for different sections
    // Projects: oldest first (1), Certificates: newest first (-1)
    const sortOrder = section === 'projects' ? 1 : -1;
    
    const items = await contentCollection
      .find({ section })
      .sort({ created_at: sortOrder })
      .toArray();
    
    console.log(`✅ Found ${items.length} items for section: ${section}`);
    // Normalize shape: keep original data payload flattened and expose id
    const normalized = items.map((item) => {
      const payload = item.data || {};
      return {
        id: item._id.toString(),
        section: item.section,
        data: payload,
        ...payload
      };
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

// ========== START SERVER ==========

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`\n✨ Express.js Backend running on http://127.0.0.1:${PORT}`);
  console.log('📡 MongoDB: Connected to Atlas');
  console.log('🔐 CORS: Enabled for localhost (ports 5173, 5174)');
  console.log('💾 Data: Fully preserved from previous Python backend');
  console.log('🖼️  Cloudinary: Image upload enabled\n');
});
