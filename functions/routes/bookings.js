const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../Booking');
const Service = require('../Service');
const Vendor = require('../Vendor');
const auth = require('../auth');

const router = express.Router();

// Create new booking (public)
router.post('/', [
  body('vendorId').notEmpty(),
  body('services').isArray({ min: 1 }),
  body('customer.name').notEmpty().trim(),
  body('customer.phone').notEmpty().trim(),
  body('bookingDate').isISO8601(),
  body('startTime').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vendorId, services, customer, bookingDate, startTime, notes } = req.body;

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isActive) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Get service details and calculate total price
    const serviceIds = services.map(s => s.service);
    const serviceDetails = await Service.find({
      _id: { $in: serviceIds },
      vendor: vendorId,
      isActive: true
    });

    if (serviceDetails.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Some services not found or inactive' });
    }

    // Calculate total price and duration
    let totalPrice = 0;
    let totalDuration = 0;

    const bookingServices = services.map(bookingService => {
      const serviceDetail = serviceDetails.find(s => s._id.toString() === bookingService.service);
      const serviceTotal = serviceDetail.price * bookingService.quantity;
      totalPrice += serviceTotal;
      totalDuration += serviceDetail.duration * bookingService.quantity;

      return {
        service: bookingService.service,
        quantity: bookingService.quantity
      };
    });

    // Calculate end time
    const startTimeDate = new Date(`${bookingDate}T${startTime}`);
    const endTimeDate = new Date(startTimeDate.getTime() + totalDuration * 60000);
    const endTime = endTimeDate.toTimeString().slice(0, 5);

    // Check for conflicts
    const conflictingBookings = await Booking.find({
      vendor: vendorId,
      bookingDate: new Date(bookingDate),
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ 
        message: 'Time slot is not available',
        conflicts: conflictingBookings.map(b => ({
          startTime: b.startTime,
          endTime: b.endTime
        }))
      });
    }

    // Create booking
    const booking = new Booking({
      vendor: vendorId,
      services: bookingServices,
      customer,
      bookingDate: new Date(bookingDate),
      startTime,
      endTime,
      totalPrice,
      notes: { customer: notes },
      source: req.headers['x-booking-source'] || 'qr-scan'
    });

    await booking.save();

    // Populate service details for response
    await booking.populate('services.service');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        confirmationCode: booking.confirmationCode,
        services: booking.services,
        customer: booking.customer,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for vendor (authenticated)
router.get('/vendor', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('vendor');
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const { status, date, page = 1, limit = 20 } = req.query;
    const query = { vendor: user.vendor._id };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.bookingDate = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(query)
      .populate('services.service')
      .sort({ bookingDate: 1, startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (authenticated)
router.patch('/:bookingId/status', auth, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.params;
    const { status, notes } = req.body;

    const user = await User.findById(req.userId).populate('vendor');
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      vendor: user.vendor._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    if (notes) {
      booking.notes.vendor = notes;
    }

    await booking.save();

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get booking by confirmation code (public)
router.get('/confirm/:confirmationCode', async (req, res) => {
  try {
    const { confirmationCode } = req.params;

    const booking = await Booking.findOne({ confirmationCode })
      .populate('vendor', 'businessName contactInfo')
      .populate('services.service');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
