const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  name: {
    en: { type: String, required: true, trim: true },
    ms: { type: String, trim: true },
    zh: { type: String, trim: true }
  },
  description: {
    en: { type: String, trim: true },
    ms: { type: String, trim: true },
    zh: { type: String, trim: true }
  },
  category: {
    type: String,
    required: true,
    enum: ['hair', 'beauty', 'massage', 'food', 'medical', 'repair', 'cleaning', 'other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceType: {
    type: String,
    enum: ['fixed', 'range', 'from'],
    default: 'fixed'
  },
  priceRange: {
    min: Number,
    max: Number
  },
  duration: {
    type: Number,
    required: true,
    min: 5 // minimum 5 minutes
  },
  slotCapacity: {
    type: Number,
    default: 1,
    min: 1
  },
  unavailableTimeSlots: [{
    start: { type: String, required: true }, // Format: "HH:MM" (e.g., "12:00")
    end: { type: String, required: true }   // Format: "HH:MM" (e.g., "13:00")
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  image: String,
  requirements: [String], // e.g., "Bring ID", "No food before treatment"
  tags: [String] // for search and filtering
}, {
  timestamps: true
});

// Index for vendor services lookup
serviceSchema.index({ vendor: 1, isActive: 1 });
serviceSchema.index({ category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
