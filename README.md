# ServEase - Digital Service Menu and Booking System

ServEase is a comprehensive digital service menu and booking system designed for local businesses. It allows service providers to create digital showcases of their services with real-time availability, while customers can scan QR codes to browse services and book appointments seamlessly.

## 🚀 Features

### For Customers
- **QR Code Access**: Scan QR codes to instantly access vendor service menus
- **Mobile-First Design**: No app download required, works on any smartphone
- **Real-Time Booking**: Live availability calendar with instant booking confirmation
- **Multilingual Support**: English, Bahasa Malaysia, and Chinese language support
- **Anonymous Booking**: No account required for customers

### For Vendors
- **Easy Setup**: Simple vendor onboarding and service management
- **QR Code Generation**: Generate unique QR codes and shareable links
- **Booking Management**: Centralized calendar for all incoming bookings
- **Real-Time Notifications**: Instant alerts for new booking requests
- **Service Management**: Add, edit, and manage services with pricing
- **Analytics**: Basic business insights and booking statistics

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **QR Code** generation with qrcode library
- **Socket.io** for real-time updates
- **Express Rate Limiting** for security

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Styled Components** for styling
- **Axios** for API calls
- **React Toastify** for notifications
- **Lucide React** for icons
- **Framer Motion** for animations

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd servease
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   Create a `.env` file in the `server` directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/servease
   
   # Server
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   
   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   
   # WhatsApp Integration (Optional)
   WHATSAPP_API_URL=your_whatsapp_api_url
   WHATSAPP_TOKEN=your_whatsapp_token
   
   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # QR Code Base URL
   QR_BASE_URL=http://localhost:3000/vendor
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## 🏗️ Project Structure

```
servease/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   └── App.js         # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/           # Configuration files
│   └── index.js          # Server entry point
└── package.json          # Root package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new vendor
- `POST /api/auth/login` - Login vendor
- `GET /api/auth/me` - Get current user

### Vendors
- `GET /api/vendors/public/:identifier` - Get vendor by QR code/URL
- `GET /api/vendors/dashboard` - Get vendor dashboard data
- `PUT /api/vendors/profile` - Update vendor profile

### Services
- `GET /api/services/vendor/:vendorId` - Get vendor services
- `POST /api/services` - Create new service
- `PUT /api/services/:serviceId` - Update service
- `DELETE /api/services/:serviceId` - Delete service

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/vendor` - Get vendor bookings
- `PATCH /api/bookings/:bookingId/status` - Update booking status
- `GET /api/bookings/confirm/:confirmationCode` - Get booking by confirmation code

### QR Codes
- `POST /api/qr/generate` - Generate QR code
- `GET /api/qr/info` - Get QR code info
- `GET /api/qr/download` - Download QR code image

## 🎯 Usage

### For Vendors
1. **Register**: Create a vendor account with business information
2. **Add Services**: Define your services with pricing and descriptions
3. **Generate QR Code**: Create your unique QR code and shareable link
4. **Manage Bookings**: View and manage incoming booking requests
5. **Update Profile**: Keep your business information current

### For Customers
1. **Scan QR Code**: Use your phone to scan the vendor's QR code
2. **Browse Services**: View available services and pricing
3. **Select Services**: Choose the services you want to book
4. **Pick Date & Time**: Select from available time slots
5. **Enter Details**: Provide your contact information
6. **Confirm Booking**: Complete your booking and receive confirmation

## 🌐 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Deploy to platforms like Heroku, Railway, or DigitalOcean
3. Update environment variables with production values
4. Ensure CORS is configured for your frontend domain

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Update API endpoints to point to your backend URL

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Helmet.js**: Security headers for Express.js

## 🚀 Future Enhancements

- **Payment Integration**: Stripe/PayPal integration for online payments
- **WhatsApp Notifications**: Automated booking confirmations via WhatsApp
- **Advanced Analytics**: Detailed business insights and reporting
- **Multi-location Support**: Support for businesses with multiple locations
- **Mobile App**: Native mobile applications for iOS and Android
- **API Documentation**: Comprehensive API documentation with Swagger

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@servease.com
- Documentation: [Link to documentation]
- Issues: [GitHub Issues](link-to-issues)

## 🙏 Acknowledgments

- Built with ❤️ for local businesses in Malaysia
- Inspired by the need for digital transformation in local service industries
- Special thanks to the open-source community for the amazing tools and libraries
