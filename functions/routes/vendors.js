const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

// Get vendor by QR code or short URL
router.get('/public/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const vendor = await Vendor.findOne({
      $or: [
        { 'qrCode.code': identifier },
        { 'qrCode.shortUrl': identifier }
      ],
      isActive: true
    }).populate('services');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Get active services
    const services = await Service.find({
      vendor: vendor._id,
      isActive: true
    });

    res.json({
      vendor: {
        id: vendor._id,
        businessName: vendor.businessName,
        businessType: vendor.businessType,
        description: vendor.description,
        contactInfo: vendor.contactInfo,
        operatingHours: vendor.operatingHours,
        languages: vendor.languages,
        profileImage: vendor.profileImage,
        coverImage: vendor.coverImage
      },
      services
    });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vendor dashboard data (authenticated)
router.get('/dashboard', auth, async (req, res) => {
  try {
    console.log('Dashboard request - userId:', req.userId);
    console.log('Request headers:', req.headers);
    const user = await User.findById(req.userId).populate('vendor');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user exists but no vendor profile, create one
    if (!user.vendor) {
      console.log('Creating vendor profile for user:', user._id);
      const vendor = new Vendor({
        businessName: user.email.split('@')[0] || 'My Business',
        businessType: 'other',
        contactInfo: {
          phone: '000-000-0000', // Default phone number
          email: user.email,
          address: {}
        }
      });
      
      await vendor.save();
      
      // Link user to vendor
      user.vendor = vendor._id;
      await user.save();
      
      // Re-populate the user with vendor
      await user.populate('vendor');
    }

    const vendor = user.vendor;
    
    // Get recent bookings
    const recentBookings = await Booking.find({ vendor: vendor._id })
      .populate('services.service')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.find({
      vendor: vendor._id,
      bookingDate: { $gte: today, $lt: tomorrow }
    }).populate('services.service');

    // Get services
    const services = await Service.find({ vendor: vendor._id });

    res.json({
      vendor,
      services,
      recentBookings,
      todayBookings,
      stats: {
        totalBookings: await Booking.countDocuments({ vendor: vendor._id }),
        pendingBookings: await Booking.countDocuments({ vendor: vendor._id, status: 'pending' }),
        todayBookings: todayBookings.length
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update business profile
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request received:', req.body);
    
    const user = await User.findById(req.userId).populate('vendor');
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = user.vendor;
    
    // Update vendor profile
    vendor.businessName = req.body.businessName || vendor.businessName;
    vendor.businessType = req.body.businessType || vendor.businessType;
    vendor.description = req.body.description || vendor.description;
    vendor.operatingHours = req.body.operatingHours || vendor.operatingHours;
    
    // Update contact info
    if (req.body.phone) {
      vendor.contactInfo.phone = req.body.phone;
    }
    if (req.body.email) {
      vendor.contactInfo.email = req.body.email;
    }
    if (req.body.address) {
      vendor.contactInfo.address.street = req.body.address;
    }

    await vendor.save();

    console.log('Updated vendor data:', {
      businessName: vendor.businessName,
      businessType: vendor.businessType,
      contactInfo: vendor.contactInfo,
      description: vendor.description,
      operatingHours: vendor.operatingHours
    });

    res.json({ 
      success: true, 
      message: 'Business profile updated successfully',
      vendor 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update vendor profile (legacy - keeping for compatibility)
router.put('/profile-legacy', auth, [
  body('businessName').optional().trim(),
  body('description').optional().trim(),
  body('contactInfo.phone').optional().trim(),
  body('contactInfo.email').optional().isEmail(),
  body('operatingHours').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId).populate('vendor');
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = user.vendor;
    const updates = req.body;

    // Update vendor fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        vendor[key] = updates[key];
      }
    });

    await vendor.save();

    res.json({
      message: 'Profile updated successfully',
      vendor
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
