# Deployment Guide

This guide covers the complete deployment process for the Enhanced Workout Tracker.

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI installed globally
- Firebase project created
- Git repository set up

## Step 1: Environment Setup

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 1.3 Login to Firebase
```bash
firebase login
```

## Step 2: Firebase Project Setup

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `workout-tracker-prod`
4. Enable Google Analytics (optional)
5. Create project

### 2.2 Enable Services
1. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode
   - Choose location (closest to your users)

2. **Authentication**:
   - Go to Authentication
   - Click "Get started"
   - Go to Sign-in method tab
   - Enable Email/Password
   - Enable Google (optional)

3. **Hosting** (optional):
   - Go to Hosting
   - Click "Get started"
   - Follow setup instructions

### 2.3 Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app
4. Register app name: `workout-tracker-web`
5. Copy the config object

## Step 3: Environment Configuration

### 3.1 Create Environment File
```bash
cp env.example .env.local
```

### 3.2 Fill in Firebase Config
Edit `.env.local` with your Firebase project details:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3.3 Generate Security Keys
Generate secure random strings for encryption keys:
```bash
# Generate 32-character random strings
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Add to `.env.local`:
```env
ENCRYPTION_KEY_INTERNAL=your_generated_key_here
ENCRYPTION_KEY_CONFIDENTIAL=your_generated_key_here
ENCRYPTION_KEY_RESTRICTED=your_generated_key_here
```

## Step 4: Firebase Project Initialization

### 4.1 Initialize Firebase in Project
```bash
firebase init
```

Select:
- ✅ Firestore: Configure security rules and indexes files
- ✅ Hosting: Configure files for Firebase Hosting (optional)
- ✅ Emulators: Set up local emulators (optional)

### 4.2 Configure Firestore
- Use existing `firestore.rules`
- Use existing `firestore.indexes.json`

### 4.3 Configure Hosting (if selected)
- Public directory: `out`
- Single-page app: Yes
- Overwrite index.html: No

## Step 5: Deploy Firestore Rules and Indexes

### 5.1 Deploy Security Rules
```bash
npm run firebase:rules
```

### 5.2 Verify Rules Deployment
Check Firebase Console → Firestore → Rules to confirm deployment.

## Step 6: Build and Test

### 6.1 Build Application
```bash
npm run build
```

### 6.2 Run Tests
```bash
# Unit tests
npm test

# E2E tests (requires running app)
npm run dev
# In another terminal:
npm run test:e2e
```

### 6.3 Test Locally
```bash
npm run dev
```
Visit http://localhost:3000 and test core functionality.

## Step 7: Deploy to Production

### 7.1 Deploy to Firebase Hosting
```bash
npm run firebase:hosting
```

### 7.2 Deploy Everything
```bash
npm run firebase:deploy
```

### 7.3 Verify Deployment
- Check Firebase Console → Hosting for your live URL
- Test the deployed application
- Verify Firestore rules are working

## Step 8: Post-Deployment Setup

### 8.1 Set Up Custom Domain (Optional)
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow DNS configuration instructions

### 8.2 Configure SSL
Firebase automatically provides SSL certificates for custom domains.

### 8.3 Set Up Monitoring
1. **Firebase Analytics**: Automatically enabled
2. **Error Tracking**: Consider adding Sentry
3. **Performance Monitoring**: Firebase Performance Monitoring

## Step 9: Security Hardening

### 9.1 Review Security Rules
- Test rules with Firebase Emulator
- Ensure proper access controls
- Regular security audits

### 9.2 Environment Security
- Never commit `.env.local` to version control
- Use different keys for different environments
- Rotate encryption keys regularly

### 9.3 Firebase Security
- Enable App Check for additional security
- Set up proper IAM roles
- Monitor for suspicious activity

## Step 10: Monitoring and Maintenance

### 10.1 Set Up Alerts
- Firebase Console → Alerts
- Set up billing alerts
- Monitor error rates

### 10.2 Regular Maintenance
- Update dependencies regularly
- Monitor performance metrics
- Review and update security rules
- Backup important data

### 10.3 Scaling Considerations
- Monitor Firestore usage and costs
- Optimize queries and indexes
- Consider CDN for static assets
- Implement caching strategies

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (18+)
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

2. **Firebase Connection Issues**:
   - Verify environment variables
   - Check Firebase project configuration
   - Ensure proper authentication

3. **Deployment Issues**:
   - Check Firebase CLI version: `firebase --version`
   - Verify project selection: `firebase use --list`
   - Check deployment logs in Firebase Console

4. **Security Rules Issues**:
   - Test rules with Firebase Emulator
   - Check rule syntax in Firebase Console
   - Verify user authentication status

### Getting Help

- Check Firebase documentation
- Review application logs
- Test with Firebase Emulator
- Contact Firebase support for platform issues

## Environment-Specific Configurations

### Development
- Use Firebase Emulator Suite
- Enable debug logging
- Use test data

### Staging
- Separate Firebase project
- Production-like data
- Full testing suite

### Production
- Optimized builds
- Error tracking
- Performance monitoring
- Security hardening

---

**Note**: This deployment guide assumes you're using Firebase Hosting. For other hosting platforms (Vercel, Netlify, etc.), adjust the deployment steps accordingly.
