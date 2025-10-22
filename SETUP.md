# ServEase Setup Guide

This guide will help you set up and run the ServEase application on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd servease
```

### 2. Run the Setup Script
```bash
npm run setup
```

This will:
- Install all dependencies (root, server, and client)
- Create a `.env` file with default configuration
- Set up the project structure

### 3. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
```bash
# If MongoDB is installed as a service, it should start automatically
# Or start it manually:
mongod
```

**macOS:**
```bash
# Using Homebrew:
brew services start mongodb-community

# Or manually:
mongod
```

**Linux:**
```bash
# Using systemctl:
sudo systemctl start mongod

# Or manually:
mongod
```

### 4. Start the Development Servers
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
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

### 3. Start the Servers
```bash
# Start backend server
cd server
npm run dev

# In a new terminal, start frontend
cd client
npm start
```

## Project Structure

```
servease/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context providers
│   │   ├── pages/        # Page components
│   │   └── App.js         # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/           # Configuration files
│   └── index.js          # Server entry point
├── package.json          # Root package.json
├── setup.js              # Setup script
└── README.md             # Project documentation
```

## Available Scripts

### Root Level
- `npm run setup` - Run the setup script
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend client
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install all dependencies

### Server Scripts
- `npm run dev` - Start server with nodemon
- `npm start` - Start server in production mode
- `npm test` - Run server tests

### Client Scripts
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run React tests
- `npm run eject` - Eject from Create React App

## Testing the Application

### 1. Create a Vendor Account
1. Go to http://localhost:3000/register
2. Fill in the registration form with your business details
3. Submit the form to create your vendor account

### 2. Add Services
1. After registration, you'll be redirected to the dashboard
2. Go to the "Services" tab
3. Click "Add Service" to create your first service
4. Fill in service details (name, description, price, duration)
5. Save the service

### 3. Generate QR Code
1. Go to the "QR Code" tab in the dashboard
2. Click "Generate QR Code"
3. Download or copy the QR code/URL for sharing

### 4. Test Customer Booking
1. Open the vendor URL in a new browser tab (or use the QR code)
2. Browse the services
3. Click "Book Now" on a service
4. Fill in the booking form
5. Complete the booking process

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running on your system.

**2. Port Already in Use**
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Kill the process using the port or change the port in the `.env` file.

**3. CORS Error**
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution**: Make sure the `CLIENT_URL` in your `.env` file matches your frontend URL.

**4. JWT Secret Error**
```
Error: secretOrPrivateKey must have a value
```
**Solution**: Make sure you have a `JWT_SECRET` in your `.env` file.

### Getting Help

If you encounter issues:

1. Check the console logs for error messages
2. Ensure all dependencies are installed correctly
3. Verify MongoDB is running
4. Check that all environment variables are set
5. Make sure no other applications are using the required ports

## Production Deployment

For production deployment:

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**:
   - Use a production MongoDB instance (MongoDB Atlas recommended)
   - Set `NODE_ENV=production`
   - Use a strong JWT secret
   - Configure proper CORS settings

3. **Deploy the backend** to platforms like:
   - Heroku
   - Railway
   - DigitalOcean
   - AWS

4. **Deploy the frontend** to platforms like:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront

## Next Steps

After successful setup:

1. **Customize the application** for your specific needs
2. **Add more services** to test the booking system
3. **Configure WhatsApp integration** for notifications
4. **Set up email notifications** for booking confirmations
5. **Deploy to production** when ready

## Support

If you need help:
- Check the [README.md](README.md) for detailed documentation
- Review the API endpoints in the server code
- Test individual components using the browser developer tools
- Check the server logs for detailed error information
