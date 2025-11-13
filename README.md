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
- **AI Marketing Tool**: Generate professional social media posters with AI-powered enhancement

## 🛠️ Tech Stack

### Backend
- **Firebase Cloud Functions** (Node.js 20) - Serverless backend API
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User authentication
- **Firebase Storage** - File storage for images and QR codes
- **Firebase Hosting** - Static site hosting
- **Gemini AI API** - AI-powered marketing poster generation

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Firebase SDK** for authentication and data access
- **React i18next** for multilingual support
- **Lucide React** for icons
- **Framer Motion** for animations

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase account and project
- Google Cloud account (for Gemini AI API)

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

3. **Firebase Setup**
   ```bash
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (if not already done)
   firebase init
   ```

4. **Configure Firebase Secrets**
   ```bash
   # Set Google AI API key for AI Marketing feature
   firebase functions:secrets:set GOOGLE_AI_API_KEY
   ```

5. **Start the development server**
   ```bash
   npm run client
   ```
   
   This will start the React development server on `http://localhost:3000`

6. **Run Firebase Emulators (Optional)**
   ```bash
   npm run firebase-emulators
   ```
   
   This starts Firebase emulators for local testing of Functions and Firestore.

## 🏗️ Project Structure

```
servease/
├── client/                    # React frontend
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   └── AIMarketingTool.js  # AI Marketing feature
│   │   ├── context/          # React context providers
│   │   ├── pages/            # Page components
│   │   ├── firebase-config.js # Firebase configuration
│   │   └── App.js            # Main app component
│   └── package.json
├── functions/                 # Firebase Cloud Functions
│   ├── index.js             # Main functions file
│   ├── routes/               # API route handlers
│   └── package.json
├── firebase.json             # Firebase configuration
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore indexes
└── package.json              # Root package.json
```

## 🔧 API Endpoints

All endpoints are hosted on Firebase Cloud Functions at:
`https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api`

### Authentication
- `POST /auth/register` - Register new vendor
- `POST /auth/login` - Login vendor
- `GET /auth/me` - Get current user (requires authentication)

### Vendors
- `GET /vendors/:vendorId` - Get vendor by ID (public)
- `GET /vendors/profile` - Get vendor profile (requires authentication)
- `PUT /vendors/profile` - Update vendor profile (requires authentication)
- `GET /vendors/dashboard` - Get vendor dashboard data (requires authentication)

### Services
- `POST /services` - Create new service (requires authentication)
- `PUT /services/:serviceId` - Update service (requires authentication)

### Bookings
- `POST /bookings` - Create new booking
- `PATCH /bookings/:bookingId/status` - Update booking status (requires authentication)

### QR Codes
- `POST /qr/generate` - Generate QR code (requires authentication)
- `GET /qr/download` - Download QR code image (requires authentication)

### AI Marketing
- `POST /ai/generate-poster` - Generate AI marketing poster (requires authentication)
  - Accepts: `imageBase64`, `prompt`, `vendorId`
  - Returns: `posterUrl` (signed URL or base64)

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

### Firebase Deployment

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```
   
   This deploys:
   - Frontend to Firebase Hosting
   - Cloud Functions to Firebase Functions
   - Firestore rules and indexes

3. **Deploy only specific services**
   ```bash
   # Deploy only hosting
   firebase deploy --only hosting
   
   # Deploy only functions
   firebase deploy --only functions
   ```

### Environment Setup
- Configure Firebase project in `.firebaserc`
- Set up Firebase Secrets for API keys:
  ```bash
  firebase functions:secrets:set GOOGLE_AI_API_KEY
  ```

### Production URLs
- **Frontend**: `https://servease-07762363-b4f31.web.app`
- **API**: `https://us-central1-servease-07762363-b4f31.cloudfunctions.net/api`

## 🔒 Security Features

- **Firebase Authentication**: Secure token-based authentication with Firebase ID tokens
- **Firestore Security Rules**: Database-level security rules
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **Firebase Secrets**: Secure storage for API keys and sensitive data
- **HTTPS Only**: All traffic encrypted with SSL/TLS

## 🚀 Features & Enhancements

### Current Features
- ✅ **AI Marketing Tool**: Generate professional social media posters with AI-powered enhancement
- ✅ **Firebase Integration**: Fully serverless architecture with Firebase
- ✅ **Real-time Database**: Firestore for real-time data synchronization
- ✅ **QR Code Generation**: Dynamic QR code generation and management
- ✅ **Multilingual Support**: English, Bahasa Malaysia, and Chinese

### Future Enhancements
- **Payment Integration**: Stripe/PayPal integration for online payments
- **WhatsApp Notifications**: Automated booking confirmations via WhatsApp
- **Advanced Analytics**: Detailed business insights and reporting
- **Multi-location Support**: Support for businesses with multiple locations
- **Mobile App**: Native mobile applications for iOS and Android
- **Enhanced AI Features**: More AI-powered tools for marketing and business optimization

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
- **Live Site**: https://servease-07762363-b4f31.web.app
- **GitHub Repository**: https://github.com/vincentlee001804/servease
- **Issues**: Please open an issue on GitHub for bugs or feature requests

## 📝 Available Scripts

- `npm run client` - Start React development server
- `npm run build` - Build React app for production
- `npm run install-all` - Install all dependencies (root, client, functions)
- `npm run firebase-deploy` - Deploy to Firebase
- `npm run firebase-serve` - Serve locally with Firebase emulators
- `npm run firebase-emulators` - Start Firebase emulators

## 🙏 Acknowledgments

- Built with ❤️ for local businesses in Malaysia
- Inspired by the need for digital transformation in local service industries
- Special thanks to the open-source community for the amazing tools and libraries
