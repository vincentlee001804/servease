const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://bcs24020018_db_user:A2P6jOGa3UmZ8TOU@servease.xa4tlyb.mongodb.net/?retryWrites=true&w=majority&appName=ServEase';

mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Import routes
const authRoutes = require('./routes/auth');
const vendorRoutes = require('./routes/vendors');
const qrRoutes = require('./routes/qr');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'firebase' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
