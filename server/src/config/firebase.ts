import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase app if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    // Create service account from environment variables
    const serviceAccount = {
      type: "service_account",
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle escaped newlines
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
      clientX509CertUrl: process.env.FIREBASE_CLIENT_CERT_URL
    };


    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
    });
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    
    // For development, you can fallback to a local implementation
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock Firestore for development');
      // No actual implementation here - the service layer would need to handle this
    }
  }
}

// Export Firestore for database operations
export const db = admin.firestore(); 