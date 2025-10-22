# MongoDB Setup Guide

The error you're seeing indicates that MongoDB is not running on your system. Here's how to fix it:

## Option 1: Install and Start MongoDB Locally

### Windows:
1. **Download MongoDB Community Server** from: https://www.mongodb.com/try/download/community
2. **Install MongoDB** following the installation wizard
3. **Start MongoDB Service:**
   ```bash
   # Open Command Prompt as Administrator
   net start MongoDB
   ```
   Or start it manually:
   ```bash
   mongod
   ```

### macOS:
1. **Install using Homebrew:**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```
2. **Start MongoDB:**
   ```bash
   brew services start mongodb-community
   ```

### Linux (Ubuntu/Debian):
1. **Install MongoDB:**
   ```bash
   sudo apt-get install mongodb
   ```
2. **Start MongoDB:**
   ```bash
   sudo systemctl start mongod
   ```

## Option 2: Use MongoDB Atlas (Cloud - Recommended)

If you prefer not to install MongoDB locally, you can use MongoDB Atlas (free tier available):

1. **Go to:** https://www.mongodb.com/atlas
2. **Create a free account**
3. **Create a new cluster** (free tier)
4. **Get your connection string**
5. **Update your `.env` file:**

```env
# Replace the MONGODB_URI in server/.env with your Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/servease?retryWrites=true&w=majority
```

## Option 3: Use Docker (If you have Docker installed)

```bash
# Run MongoDB in a Docker container
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Verify MongoDB is Running

After starting MongoDB, you can verify it's working:

```bash
# Connect to MongoDB shell
mongosh

# Or if using older version:
mongo
```

## Quick Fix for Development

If you just want to get the app running quickly, you can temporarily modify the server to handle the connection error gracefully:

1. **Update `server/index.js`** to add error handling
2. **Or use MongoDB Atlas** (cloud version) which is easier to set up

## Recommended: Use MongoDB Atlas

For development, I recommend using MongoDB Atlas (cloud) as it's:
- ✅ No local installation required
- ✅ Free tier available
- ✅ Easy to set up
- ✅ Works on any system

### Steps to use MongoDB Atlas:
1. Go to https://www.mongodb.com/atlas
2. Sign up for free
3. Create a cluster
4. Get your connection string
5. Update `server/.env` with the connection string
6. Restart your server

Would you like me to help you set up MongoDB Atlas, or would you prefer to install MongoDB locally?
