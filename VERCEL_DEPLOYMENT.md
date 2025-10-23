# ServEase Vercel Deployment Guide

## 🚀 Deploying ServEase to Vercel

### Prerequisites
- GitHub repository with your ServEase code
- Vercel account (free at vercel.com)

### Step 1: Prepare Your Repository
1. Make sure all changes are committed and pushed to GitHub
2. Your repository should have the following structure:
   ```
   servease/
   ├── api/
   │   └── index.js          # Vercel serverless function
   ├── client/               # React frontend
   ├── server/               # Express backend (for local dev)
   ├── vercel.json           # Vercel configuration
   └── package.json
   ```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the following settings:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/build`

#### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: servease
# - Directory: ./
```

### Step 3: Configure Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Click "Environment Variables"
3. Add the following variables:

```
MONGODB_URI = mongodb+srv://bcs24020018_db_user:A2P6jOGa3UmZ8TOU@servease.xa4tlyb.mongodb.net/?retryWrites=true&w=majority&appName=ServEase
JWT_SECRET = servease_super_secret_jwt_key_2024
NODE_ENV = production
```

### Step 4: Update MongoDB Atlas IP Whitelist

1. Go to your MongoDB Atlas dashboard
2. Navigate to "Network Access"
3. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
4. This allows Vercel's serverless functions to connect

### Step 5: Test Your Deployment

Your app will be available at:
- **Production URL**: `https://servease.vercel.app`
- **Preview URLs**: `https://servease-git-[branch].vercel.app`

### Step 6: Custom Domain (Optional)

1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check that all dependencies are in root `package.json`
   - Ensure `vercel-build` script exists

2. **API Routes Not Working**
   - Verify `vercel.json` configuration
   - Check that `/api/index.js` exists

3. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist
   - Check environment variables in Vercel dashboard

4. **Frontend Not Loading**
   - Ensure React build is in `client/build`
   - Check that static files are served correctly

## 📊 Vercel Benefits

- ✅ **Automatic deployments** from GitHub
- ✅ **Global CDN** for fast loading
- ✅ **Serverless functions** for backend
- ✅ **Free tier** with generous limits
- ✅ **Easy environment variable management**
- ✅ **Built-in analytics**

## 🎯 Next Steps

1. Deploy to Vercel
2. Test all functionality
3. Set up custom domain (optional)
4. Configure monitoring and analytics
