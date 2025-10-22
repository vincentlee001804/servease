const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

const router = express.Router();

// Get services for a vendor (public)
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { language = 'en' } = req.query;

    const services = await Service.find({
      vendor: vendorId,
      isActive: true
    });

    // Format services with language-specific content
    const formattedServices = services.map(service => ({
      id: service._id,
      name: service.name[language] || service.name.en,
      description: service.description[language] || service.description.en,
      category: service.category,
      price: service.price,
      priceType: service.priceType,
      priceRange: service.priceRange,
      duration: service.duration,
      image: service.image,
      requirements: service.requirements,
      tags: service.tags
    }));

    res.json(formattedServices);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new service (authenticated)
router.post('/', auth, [
  body('name.en').notEmpty().trim(),
  body('category').notEmpty(),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('duration').isInt({ min: 5 })
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

    const serviceData = {
      ...req.body,
      vendor: user.vendor._id
    };

    const service = new Service(serviceData);
    await service.save();

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update service (authenticated)
router.put('/:serviceId', auth, [
  body('name.en').optional().trim(),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('duration').optional().isInt({ min: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serviceId } = req.params;
    const user = await User.findById(req.userId).populate('vendor');
    
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const service = await Service.findOne({
      _id: serviceId,
      vendor: user.vendor._id
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Update service fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        service[key] = req.body[key];
      }
    });

    await service.save();

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete service (authenticated)
router.delete('/:serviceId', auth, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const user = await User.findById(req.userId).populate('vendor');
    
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const service = await Service.findOne({
      _id: serviceId,
      vendor: user.vendor._id
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Soft delete by setting isActive to false
    service.isActive = false;
    await service.save();

    res.json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
