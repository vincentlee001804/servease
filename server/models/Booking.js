const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    whatsapp: {
      type: String,
      trim: true
    }
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    customer: String,
    vendor: String
  },
  source: {
    type: String,
    enum: ['qr-scan', 'shared-link', 'admin', 'walk-in'],
    default: 'qr-scan'
  },
  confirmationCode: {
    type: String,
    unique: true,
    required: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for vendor bookings lookup
bookingSchema.index({ vendor: 1, bookingDate: 1 });
bookingSchema.index({ 'customer.phone': 1 });
bookingSchema.index({ confirmationCode: 1 }, { unique: true });

// Generate confirmation code before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.confirmationCode) {
    this.confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
