const express = require('express');
const QRCode = require('qrcode');
const shortid = require('shortid');
const User = require('../User');
const Vendor = require('../Vendor');
const auth = require('../auth');

const router = express.Router();

// Generate QR code for vendor (authenticated)
router.post('/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('vendor');
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = user.vendor;
    const baseUrl = process.env.QR_BASE_URL || 'http://localhost:3000/vendor';
    
    // Generate unique code and short URL
    const qrCode = shortid.generate();
    const shortUrl = shortid.generate();
    const fullUrl = `${baseUrl}/${qrCode}`;
    const shortUrlFull = `${baseUrl}/s/${shortUrl}`;

    // Generate QR code image
    const qrImageUrl = await QRCode.toDataURL(fullUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update vendor with QR code info
    vendor.qrCode = {
      code: qrCode,
      shortUrl: shortUrl,
      qrImageUrl: qrImageUrl
    };

    await vendor.save();

    res.json({
      message: 'QR code generated successfully',
      qrCode: {
        code: qrCode,
        shortUrl: shortUrl,
        fullUrl: fullUrl,
        shortUrlFull: shortUrlFull,
        qrImageUrl: qrImageUrl
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get QR code info for vendor (authenticated)
router.get('/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('vendor');
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = user.vendor;
    const baseUrl = process.env.QR_BASE_URL || 'http://localhost:3000/vendor';

    if (!vendor.qrCode || !vendor.qrCode.code) {
      return res.status(404).json({ message: 'QR code not generated yet' });
    }

    const qrInfo = {
      code: vendor.qrCode.code,
      shortUrl: vendor.qrCode.shortUrl,
      fullUrl: `${baseUrl}/${vendor.qrCode.code}`,
      shortUrlFull: `${baseUrl}/s/${vendor.qrCode.shortUrl}`,
      qrImageUrl: vendor.qrCode.qrImageUrl
    };

    res.json(qrInfo);
  } catch (error) {
    console.error('Get QR info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download QR code image (authenticated)
router.get('/download', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('vendor');
    if (!user || !user.vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = user.vendor;
    const baseUrl = process.env.QR_BASE_URL || 'http://localhost:3000/vendor';

    if (!vendor.qrCode || !vendor.qrCode.code) {
      return res.status(404).json({ message: 'QR code not generated yet' });
    }

    const fullUrl = `${baseUrl}/${vendor.qrCode.code}`;
    
    // Generate high-resolution QR code for download
    const qrImageBuffer = await QRCode.toBuffer(fullUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="servease-qr-${vendor.businessName.replace(/\s+/g, '-')}.png"`);
    res.send(qrImageBuffer);
  } catch (error) {
    console.error('Download QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
