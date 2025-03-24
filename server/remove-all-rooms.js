// Simple script to remove all rooms from Firebase
require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: process.env.FIREBASE_AUTH_URI,
  tokenUri: process.env.FIREBASE_TOKEN_URI,
  authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  clientX509CertUrl: process.env.FIREBASE_CLIENT_CERT_URL
};

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
});

const db = admin.firestore();
const roomsCollection = db.collection('rooms');

async function removeAllRooms() {
  try {
    const snapshot = await roomsCollection.get();
    
    if (snapshot.empty) {
      console.log('No rooms to delete');
      process.exit(0);
    }
    
    // Use a batch to delete all rooms efficiently
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} rooms`);
    process.exit(0);
  } catch (error) {
    console.error('Error removing all rooms:', error);
    process.exit(1);
  }
}

// Execute the function
removeAllRooms(); 