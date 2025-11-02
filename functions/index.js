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

// Middleware
app.use(cors({ 
  origin: ['https://servease-07762363-b4f31.web.app', 'http://localhost:3000'],
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT Secret
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

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
        smtpUser = smtpUser || config.smtp?.user || 'your@email.com';
        smtpPass = smtpPass || config.smtp?.pass || 'app-password';
      } catch (configError) {
        // functions.config() might not work in v2, use environment variables or defaults
        console.warn('Could not access functions.config(), using environment variables or defaults');
        smtpUser = smtpUser || 'your@email.com';
        smtpPass = smtpPass || 'app-password';
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

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ServEase API is running with Firestore' });
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

// Expose Express app as a Firebase Function (v2 - Cloud Run)
// Wrap Express app in a handler function for proper Cloud Run compatibility
exports.api = onRequest(
  {
    region: 'us-central1',
    cors: false, // Let Express handle CORS
  },
  (req, res) => {
    // Use Express app to handle the request
    return app(req, res);
  }
);
