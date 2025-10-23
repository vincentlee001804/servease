const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/qr', require('./routes/qr'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

// Temporary hardcoded values for testing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bcs24020018_db_user:A2P6jOGa3UmZ8TOU@servease.xa4tlyb.mongodb.net/?retryWrites=true&w=majority&appName=ServEase';
const JWT_SECRET = process.env.JWT_SECRET || 'servease_super_secret_jwt_key_2024';

console.log('Using MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set');
console.log('Using JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend should be available at http://localhost:3002`);
    console.log(`🔗 API available at http://localhost:${PORT}/api`);
  });
})
.catch((error) => {
  console.error('❌ Database connection error:', error.message);
  console.log('\n🔧 To fix this issue:');
  console.log('1. Make sure MongoDB is running on your system');
  console.log('2. Or use MongoDB Atlas (cloud) - see MONGODB_SETUP.md');
  console.log('3. Update MONGODB_URI in server/.env file');
  console.log('\n📖 For detailed setup instructions, see: MONGODB_SETUP.md');
  
  // Don't exit immediately, let the user see the error message
  setTimeout(() => {
    process.exit(1);
  }, 5000);
});

module.exports = app;
