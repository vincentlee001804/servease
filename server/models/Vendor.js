const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true,
    enum: ['salon', 'spa', 'restaurant', 'clinic', 'repair', 'cleaning', 'other']
  },
  description: {
    type: String,
    trim: true
  },
  contactInfo: {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    whatsapp: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'Malaysia' }
    }
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },
  qrCode: {
    code: {
      type: String,
      unique: true,
      required: false
    },
    shortUrl: {
      type: String,
      unique: true,
      required: false
    },
    qrImageUrl: String
  },
  settings: {
    allowRemoteBooking: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    advanceBookingDays: { type: Number, default: 30 },
    slotDuration: { type: Number, default: 30 }, // in minutes
    maxConcurrentBookings: { type: Number, default: 1 }
  },
  languages: [{
    type: String,
    enum: ['en', 'ms', 'zh'],
    default: ['en']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: String,
  coverImage: String
}, {
  timestamps: true
});

// Index for QR code lookup
vendorSchema.index({ 'qrCode.code': 1 }, { unique: true });
vendorSchema.index({ 'qrCode.shortUrl': 1 }, { unique: true });

module.exports = mongoose.model('Vendor', vendorSchema);
