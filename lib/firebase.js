import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { logError, ErrorTypes } from './errorLogger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate Firebase configuration
if (typeof window !== 'undefined' && (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId)) {
  const error = new Error('Firebase configuration is missing required environment variables');
  logError(error, {
    type: ErrorTypes.FIREBASE,
    severity: 'critical',
    missingConfig: {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId
    }
  });
}

// Initialize Firebase with error handling
let app, db, auth;

try {
  if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.warn('Firebase not initialized due to missing configuration');
  }
} catch (error) {
  logError(error, {
    type: ErrorTypes.FIREBASE,
    severity: 'critical',
    component: 'firebase-init'
  });

  // Create mock objects for development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using mock Firebase objects for development');
  }
}

export { app, db, auth };