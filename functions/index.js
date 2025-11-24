// Load environment variables from .env file in local development
if (process.env.NODE_ENV !== 'production' && !process.env.FUNCTIONS_EMULATOR) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not installed, that's okay for production
  }
}

const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin (with error handling for re-initialization)
try {
admin.initializeApp();
} catch (error) {
  // Admin already initialized, use existing instance
  if (error.code !== 'app/already-initialized') {
    throw error;
  }
}

// Get Firestore instance
const db = admin.firestore();

// Create Express app
const app = express();

// Middleware - CORS Configuration
const allowedOrigins = [
  'https://servease-07762363-b4f31.web.app',
  'http://localhost:3000'
];
const previewRegex = /^https:\/\/servease-07762363-b4f31--[a-z0-9-]+\.web\.app$/i;
// Allow any localhost port for development
const localhostRegex = /^http:\/\/localhost:\d+$/;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    // Check if origin is in allowed list, matches preview pattern, or is localhost
    if (allowedOrigins.includes(origin) || previewRegex.test(origin) || localhostRegex.test(origin)) {
      callback(null, true);
    } else {
      console.warn('Blocked CORS origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Manual CORS middleware to ensure headers are always set
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log for debugging
  if (req.method === 'OPTIONS' || origin) {
    console.log('CORS check:', { method: req.method, origin, path: req.path });
  }
  
  // Check if origin is allowed (including any localhost port for development)
  const isAllowed = !origin || allowedOrigins.includes(origin) || previewRegex.test(origin) || localhostRegex.test(origin);
  
  if (isAllowed) {
    // Set exact origin (required when credentials: true)
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS request immediately
    if (req.method === 'OPTIONS') {
      console.log('OPTIONS preflight handled for origin:', origin);
      return res.status(200).end();
    }
  } else {
    console.warn('CORS blocked:', { origin, path: req.path, method: req.method });
    // Still handle OPTIONS even if origin doesn't match (for debugging)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

// Apply CORS middleware (as backup)
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT Secret - Load from environment variable
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('JWT_SECRET environment variable is not set!');
  throw new Error('JWT_SECRET must be set in environment variables');
})();

// Email transport (configure with your SMTP or Gmail App Password)
// Lazy initialization to avoid issues with functions.config() in v2 functions
let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    try {
      // Try to get config, but don't fail if it's not available
      let smtpUser = process.env.SMTP_USER;
      let smtpPass = process.env.SMTP_PASS;
      
      try {
        const config = functions.config();
        smtpUser = smtpUser || config.smtp?.user || process.env.SMTP_USER;
        smtpPass = smtpPass || config.smtp?.pass || process.env.SMTP_PASS;
      } catch (configError) {
        // functions.config() might not work in v2, use environment variables
        console.warn('Could not access functions.config(), using environment variables');
        smtpUser = smtpUser || process.env.SMTP_USER;
        smtpPass = smtpPass || process.env.SMTP_PASS;
      }
      
      if (!smtpUser || !smtpPass) {
        console.warn('SMTP credentials not configured. Email functionality will be disabled.');
      }
      
      transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      // Create a dummy transporter that won't crash but will log errors
      transporter = {
        sendMail: async () => {
          console.error('Email transporter not properly configured');
        }
      };
  }
  }
  return transporter;
};

async function sendEmail(to, subject, html) {
  try {
    const emailTransporter = getTransporter();
    await emailTransporter.sendMail({ from: 'ServEase <no-reply@servease.app>', to, subject, html });
  } catch (e) {
    console.error('Email send error:', e);
  }
}

const formatICSDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const escapeICSText = (text = '') => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
};

// Auth middleware - supports both Firebase Auth tokens and JWT tokens
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.warn('Auth middleware: missing Authorization header', {
      path: req.path,
      method: req.method,
      headers: req.headers
    });
  }
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('Auth middleware: no token extracted', {
      path: req.path,
      method: req.method,
      authHeader
    });
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Try Firebase Auth token first
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Auth middleware: Firebase token verified', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        path: req.path
      });
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...decodedToken
      };
      return next();
    } catch (firebaseError) {
      console.warn('Auth middleware: Firebase verify failed, falling back to JWT', {
        error: firebaseError.message,
        path: req.path
      });
      // If Firebase token verification fails, try JWT as fallback
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
          console.warn('Auth middleware: JWT verify failed', {
            error: err.message,
            path: req.path
          });
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Routes
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ServEase API is running with Firestore' });
});

// AI: Generate marketing poster using Gemini API (gemini-2.5-flash-image)
// Docs: https://ai.google.dev/gemini-api/docs/image-generation

// Handle OPTIONS preflight for AI endpoint
app.options('/ai/generate-poster', cors(corsOptions));

app.post('/ai/generate-poster', authenticateToken, async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body || {};
    if (!imageBase64 || !prompt) {
      return res.status(400).json({ message: 'imageBase64 and prompt are required' });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_AI_API_KEY is not set');
      return res.status(500).json({ message: 'AI service not configured' });
    }

    // Clean base64 data (remove data URL prefix if present)
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    // Determine MIME type from original imageBase64
    let mimeType = 'image/png';
    if (imageBase64.includes('data:image/jpeg') || imageBase64.includes('data:image/jpg')) {
      mimeType = 'image/jpeg';
    }

    // Use the prompt as-is (frontend handles enhancement if enabled)
    // Call Gemini API with gemini-2.5-flash-image model
    const genResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ['Image'],
            imageConfig: {
              aspectRatio: '4:5' // Good for social media
            }
          }
        })
      }
    );

    if (!genResp.ok) {
      const text = await genResp.text();
      console.error('Gemini API error:', genResp.status, text);
      return res.status(502).json({ message: 'AI image generation failed', detail: text });
    }

    const genJson = await genResp.json();
    
    // Extract image from response parts
    let imageData = null;
    if (genJson.candidates && genJson.candidates[0] && genJson.candidates[0].content) {
      const parts = genJson.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          imageData = part.inlineData;
          break;
        }
      }
    }

    if (!imageData || !imageData.data) {
      console.error('No image data in response:', JSON.stringify(genJson));
      return res.status(502).json({ message: 'No image returned from AI', detail: JSON.stringify(genJson) });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData.data, 'base64');
    
    // Try to save to Firebase Storage, fallback to base64 if it fails
    try {
      // Use explicit bucket name from Firebase config
      const bucketName = 'servease-07762363-b4f31.firebasestorage.app';
      const bucket = admin.storage().bucket(bucketName);
      
      const filePath = `ai-posters/${req.user.email || req.user.uid}/${Date.now()}-poster.png`;
      const file = bucket.file(filePath);
      
      await file.save(buffer, {
        contentType: 'image/png',
        resumable: false,
        metadata: { cacheControl: 'public, max-age=31536000' }
      });

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        posterUrl: signedUrl,
        storagePath: filePath
      });
    } catch (storageError) {
      // If storage fails (bucket doesn't exist, permissions issue, etc.), return base64 directly
      console.warn('Storage save failed, returning base64 image directly:', storageError.message);
      const base64Image = `data:image/png;base64,${imageData.data}`;
      return res.json({
        success: true,
        posterUrl: base64Image,
        storagePath: null,
        note: 'Image returned as base64 (storage unavailable)'
      });
    }
  } catch (error) {
    console.error('AI generate poster error:', error);
    res.status(500).json({ message: 'Failed to generate marketing poster', error: error.message });
  }
});

// Register
app.post('/auth/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { email, password, businessName, businessType, phone, address } = req.body;

    // Validate required fields
    if (!email || !password || !businessName) {
      console.log('Missing fields:', { email: !!email, password: !!password, businessName: !!businessName });
      return res.status(400).json({ message: 'Email, password, and business name are required' });
    }

    // Check if user exists
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await userRef.set({
      email: email,
      password: hashedPassword,
      name: businessName, // Use business name as the name
      businessName: businessName,
      role: 'vendor',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create vendor profile
    const vendorData = {
      email: email,
      businessName: businessName,
      contactInfo: {
        phone: phone || '',
        email: email
      },
      businessInfo: {
        type: businessType || '',
        description: '',
        address: address ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}`.trim() : ''
      },
      operatingHours: {
        monday: { open: '09:00', close: '17:00', isOpen: true },
        tuesday: { open: '09:00', close: '17:00', isOpen: true },
        wednesday: { open: '09:00', close: '17:00', isOpen: true },
        thursday: { open: '09:00', close: '17:00', isOpen: true },
        friday: { open: '09:00', close: '17:00', isOpen: true },
        saturday: { open: '09:00', close: '17:00', isOpen: true },
        sunday: { open: '09:00', close: '17:00', isOpen: false }
      },
      services: [],
      qrCode: {
        code: '',
        shortUrl: '',
        qrImage: ''
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log('Saving vendor data to Firestore:', vendorData);
    await db.collection('vendors').doc(email).set(vendorData);
    console.log('Vendor data saved successfully');
    
    // Verify the vendor was created
    const verifyRef = db.collection('vendors').doc(email);
    const verifyDoc = await verifyRef.get();
    console.log('Vendor verification - exists:', verifyDoc.exists);
    if (verifyDoc.exists) {
      console.log('Vendor data verified:', verifyDoc.data());
    }

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { email: email, role: 'vendor' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      message: 'User registered successfully',
      token,
      user: {
        email: email,
        name: businessName,
        businessName: businessName,
        role: 'vendor'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;

    // Get user
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userDoc.data();

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        businessName: user.businessName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get vendor profile
app.get('/vendors/profile', authenticateToken, async (req, res) => {
  try {
    const vendorRef = db.collection('vendors').doc(req.user.email);
    const vendorDoc = await vendorRef.get();
    
    if (!vendorDoc.exists) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const vendor = vendorDoc.data();
    delete vendor.password; // Remove password from response
    
    res.json(vendor);
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ message: 'Failed to get vendor profile' });
  }
});

// Update vendor profile
app.put('/vendors/profile', authenticateToken, async (req, res) => {
  try {
    const vendorRef = db.collection('vendors').doc(req.user.email);
    await vendorRef.update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Generate QR Code
app.post('/qr/generate', authenticateToken, async (req, res) => {
  try {
    const { vendorId } = req.body;
    
    // Generate QR code data
    const qrData = `https://servease-07762363-b4f31.web.app/vendor/${vendorId}`;
    const shortUrl = `https://servease-07762363-b4f31.web.app/s/${vendorId}`;
    
    // Update vendor with QR code info
    const vendorRef = db.collection('vendors').doc(req.user.email);
    await vendorRef.update({
      'qrCode.code': qrData,
      'qrCode.shortUrl': shortUrl,
      'qrCode.qrImage': `data:image/png;base64,${qrData}` // Simplified for demo
    });

    res.json({
      qrCode: qrData,
      shortUrl: shortUrl,
      qrImage: `data:image/png;base64,${qrData}`
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
});

// Get vendor by ID (public)
app.get('/vendors/:vendorId', async (req, res) => {
  try {
    const vendorRef = db.collection('vendors').doc(req.params.vendorId);
    const vendorDoc = await vendorRef.get();
    
    if (!vendorDoc.exists) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = vendorDoc.data();
    delete vendor.password; // Remove sensitive data
    
    res.json(vendor);
  } catch (error) {
    console.error('Get vendor by ID error:', error);
    res.status(500).json({ message: 'Failed to get vendor' });
  }
});

// Get current user info
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.email);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userDoc.data();
    delete user.password; // Remove password from response
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
});

// Get vendor dashboard data
app.get('/vendors/dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('Dashboard request for user:', req.user.email);
    const vendorRef = db.collection('vendors').doc(req.user.email);
    const vendorDoc = await vendorRef.get();
    
    if (!vendorDoc.exists) {
      console.log('Vendor profile not found for:', req.user.email);
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const vendor = vendorDoc.data();
    
    // Get bookings for this vendor
    const bookingsRef = db.collection('bookings').where('vendorEmail', '==', req.user.email);
    const bookingsSnapshot = await bookingsRef.get();
    const bookings = [];
    
    bookingsSnapshot.forEach(doc => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    // Calculate dashboard stats
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;
    
    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysBookings = bookings.filter(booking => {
      const bookingDate = booking.createdAt?.toDate();
      return bookingDate && bookingDate >= today && bookingDate < tomorrow;
    });

    const dashboardData = {
      vendor: {
        businessName: vendor.businessName,
        businessType: vendor.businessInfo?.type || '',
        phone: vendor.contactInfo?.phone || '',
        email: vendor.email,
        address: vendor.businessInfo?.address || '',
        description: vendor.businessInfo?.description || '',
        operatingHours: vendor.operatingHours || {}
      },
      stats: {
        totalBookings,
        pendingBookings,
        todaysBookings: todaysBookings.length,
        totalServices: vendor.services?.length || 0
      },
      recentBookings: todaysBookings.slice(0, 5), // Last 5 bookings
      services: vendor.services || []
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

// Add missing routes
app.post('/bookings', async (req, res) => {
  try {
    const { vendorEmail, services, customer, bookingDate, startTime, totalPrice, totalDuration } = req.body;
    
    // Create booking
    const bookingData = {
      vendorEmail,
      services,
      customer,
      bookingDate,
      startTime,
      totalPrice,
      totalDuration,
      status: 'pending',
      confirmationCode: Math.random().toString(36).substr(2, 9).toUpperCase(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const bookingRef = await db.collection('bookings').add(bookingData);
    
    res.json({
      success: true,
      booking: { id: bookingRef.id, ...bookingData }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

app.get('/bookings/:bookingId/ics', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'Confirmation code is required' });
    }

    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingDoc.data();
    if (
      !booking.confirmationCode ||
      booking.confirmationCode.toUpperCase() !== String(code).toUpperCase()
    ) {
      return res.status(403).json({ message: 'Invalid confirmation code' });
    }

    const vendorDoc = booking.vendorEmail
      ? await db.collection('vendors').doc(booking.vendorEmail).get()
      : null;
    const vendor = vendorDoc?.exists ? vendorDoc.data() : null;

    const dateString = booking.bookingDate || booking.date;
    const timeString = booking.bookingTime || booking.startTime || '09:00';

    if (!dateString) {
      return res.status(400).json({ message: 'Booking date is missing' });
    }

    const startDate = new Date(`${dateString}T${timeString}`);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: 'Invalid booking date or time' });
    }

    const durationMinutes = booking.totalDuration || 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const summary = booking.serviceName
      ? `ServEase Booking - ${booking.serviceName}`
      : 'ServEase Booking';
    const location = vendor?.businessInfo?.address || vendor?.businessName || '';
    const descriptionLines = [
      `Vendor: ${vendor?.businessName || booking.vendorEmail || ''}`,
      `Customer: ${booking.customerName || ''}`,
      booking.notes ? `Notes: ${booking.notes}` : '',
      '',
      `Manage booking: https://servease-07762363-b4f31.web.app/vendor/${encodeURIComponent(booking.vendorEmail || '')}`
    ].filter(Boolean);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ServEase//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${bookingId}@servease`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICSText(summary)}`,
      location ? `LOCATION:${escapeICSText(location)}` : '',
      `DESCRIPTION:${escapeICSText(descriptionLines.join('\n'))}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ]
      .filter(Boolean)
      .join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="servease-booking-${bookingId}.ics"`
    );
    return res.status(200).send(icsContent);
  } catch (error) {
    console.error('Generate ICS error:', error);
    return res.status(500).json({ message: 'Failed to generate calendar invite' });
  }
});

app.post('/services', authenticateToken, async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      vendorEmail: req.user.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const serviceRef = await db.collection('services').add(serviceData);
    
    res.json({
      success: true,
      service: { id: serviceRef.id, ...serviceData }
    });
  } catch (error) {
    console.error('Service creation error:', error);
    res.status(500).json({ message: 'Failed to create service' });
  }
});

app.put('/services/:serviceId', authenticateToken, async (req, res) => {
  try {
    const serviceRef = db.collection('services').doc(req.params.serviceId);
    await serviceRef.update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Service update error:', error);
    res.status(500).json({ message: 'Failed to update service' });
  }
});

app.get('/qr/download', authenticateToken, async (req, res) => {
  try {
    // For now, return a placeholder QR code
    const qrData = `https://servease-07762363-b4f31.web.app/vendor/${req.user.email}`;
    res.json({ qrCode: qrData });
  } catch (error) {
    console.error('QR download error:', error);
    res.status(500).json({ message: 'Failed to download QR code' });
  }
});

app.patch('/bookings/:bookingId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const bookingRef = db.collection('bookings').doc(req.params.bookingId);
    await bookingRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const snap = await bookingRef.get();
    const booking = snap.data();
    if (status === 'confirmed' && booking?.customerEmail) {
      // send confirmation email immediately
      const dateStr = new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const html = `<h2>Your booking is confirmed</h2><p>Service: ${booking.serviceName || 'Service'}</p><p>Date: ${dateStr}</p><p>Time: ${booking.bookingTime}</p>`;
      sendEmail(booking.customerEmail, 'Booking Confirmed - ServEase', html);

      // schedule reminder 24h before
      const eventTime = new Date(`${booking.bookingDate}T${(booking.bookingTime || '09:00')}:00Z`).getTime();
      const reminderTime = eventTime - 24 * 60 * 60 * 1000;
      // persist reminder task
      await db.collection('emailReminders').add({
        to: booking.customerEmail,
        subject: 'Appointment Reminder - ServEase',
        html: `<h2>Reminder</h2><p>You have an appointment tomorrow for ${booking.serviceName || 'Service'} at ${booking.bookingTime}.</p>`,
        sendAt: admin.firestore.Timestamp.fromMillis(reminderTime),
        status: 'pending',
        bookingId: req.params.bookingId
      });
    }
    
    res.json({ success: true, message: 'Booking status updated' });
  } catch (error) {
    console.error('Booking status update error:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
});

// Global error handler - ensures all errors return JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Expose Express app as a Firebase Function (v2 - Cloud Run)
// Wrap Express app in a handler function for proper Cloud Run compatibility
exports.api = onRequest(
  {
    region: 'us-central1',
    cors: true, // Enable CORS at function level - Express will handle fine-grained control
    secrets: ['GOOGLE_AI_API_KEY'], // Reference the secret
  },
  (req, res) => {
    // Use Express app to handle the request
    // Express middleware will handle CORS filtering and additional headers
    return app(req, res);
  }
);
