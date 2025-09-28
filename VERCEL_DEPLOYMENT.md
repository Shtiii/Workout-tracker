# Vercel Deployment Guide

This guide covers deploying the Enhanced Workout Tracker to Vercel with Firebase backend.

## Prerequisites

- Node.js 18+ and npm
- Git repository
- Vercel account
- Firebase project

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: `workout-tracker-prod`
3. Enable Firestore Database
4. Enable Authentication (Email/Password + Google)
5. Get your Firebase config from Project Settings

### 1.2 Deploy Firestore Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Firestore only)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## Step 2: Git Repository Setup

### 2.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Enhanced Workout Tracker"
```

### 2.2 Push to GitHub/GitLab
```bash
# Create repository on GitHub/GitLab, then:
git remote add origin https://github.com/yourusername/workout-tracker.git
git push -u origin main
```

## Step 3: Vercel Setup

### 3.1 Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository

### 3.2 Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### 3.3 Set Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**For each environment** (Production, Preview, Development):
- Click "Add" for each variable
- Set the same values for all environments

## Step 4: Deploy

### 4.1 Automatic Deployment
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Your app will be available at `https://your-project.vercel.app`

### 4.2 Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed by Vercel

## Step 5: Post-Deployment Setup

### 5.1 Update Firebase Auth Settings
1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to "Authorized domains":
   - `your-project.vercel.app`
   - `your-custom-domain.com` (if using custom domain)

### 5.2 Test the Application
1. Visit your deployed URL
2. Test user registration/login
3. Test core functionality
4. Check browser console for errors

### 5.3 Set Up Monitoring
1. **Vercel Analytics**: Enable in Project Settings
2. **Firebase Analytics**: Automatically enabled
3. **Error Tracking**: Consider adding Sentry

## Step 6: Continuous Deployment

### 6.1 Automatic Deployments
- Every push to `main` branch → Production deployment
- Pull requests → Preview deployments
- Other branches → Preview deployments

### 6.2 Environment-Specific Configurations

#### Development
- Use Firebase Emulator Suite locally
- Test with `npm run dev`

#### Preview/Staging
- Same Firebase project (or separate staging project)
- Test with preview URLs

#### Production
- Production Firebase project
- Custom domain
- Monitoring enabled

## Step 7: Local Development with Vercel

### 7.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 7.2 Link to Vercel Project
```bash
vercel link
```

### 7.3 Pull Environment Variables
```bash
vercel env pull .env.local
```

### 7.4 Run Locally
```bash
npm run dev
```

## Step 8: Advanced Configuration

### 8.1 Vercel Configuration
The `vercel.json` file includes:
- Security headers
- Cache control for static assets
- Service worker configuration
- Environment variable mapping

### 8.2 Performance Optimization
- Vercel automatically optimizes images
- Edge functions for API routes
- CDN for static assets
- Automatic HTTPS

### 8.3 Security
- Security headers configured
- HTTPS enforced
- Environment variables secured
- Firebase security rules

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (18+)
   - Verify all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

2. **Firebase Connection Issues**:
   - Verify environment variables in Vercel
   - Check Firebase project configuration
   - Ensure authorized domains include Vercel URL

3. **Authentication Issues**:
   - Add Vercel domain to Firebase authorized domains
   - Check Firebase Auth configuration
   - Verify environment variables

4. **Environment Variable Issues**:
   - Ensure variables start with `NEXT_PUBLIC_` for client-side
   - Check variable names match exactly
   - Redeploy after adding new variables

### Getting Help

- Check Vercel deployment logs
- Review Firebase Console for errors
- Test locally with `vercel dev`
- Check Vercel documentation

## Environment Variables Reference

### Required Firebase Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Optional Variables
```
NEXT_PUBLIC_ANALYTICS_ID
NEXT_PUBLIC_SENTRY_DSN
ENCRYPTION_KEY_INTERNAL
ENCRYPTION_KEY_CONFIDENTIAL
ENCRYPTION_KEY_RESTRICTED
```

## Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Firestore rules deployed
- [ ] Git repository set up and pushed
- [ ] Vercel project connected to Git
- [ ] Environment variables configured in Vercel
- [ ] Firebase authorized domains updated
- [ ] Application tested on deployed URL
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up
- [ ] Error tracking configured (optional)

---

**Note**: This deployment uses Vercel for hosting and Firebase for backend services. The application will automatically deploy on every Git push.


