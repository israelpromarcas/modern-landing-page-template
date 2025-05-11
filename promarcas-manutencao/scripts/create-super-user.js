const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin with service account
const serviceAccount = {
  "type": "service_account",
  "project_id": "aplicativocadastro-53123",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "your-client-email",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "your-cert-url"
};

const app = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(app);
const db = getFirestore(app);

async function createSuperUser() {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: 'goes95@gmail.com',
      password: 'superuser123',
      emailVerified: true
    });

    // Create user document in Firestore
    await db.collection('Users').doc(userRecord.uid).set({
      email: 'goes95@gmail.com',
      role: 'superuser',
      status: 'active',
      createdAt: new Date().toISOString()
    });

    console.log('Super user created successfully:', userRecord.uid);
    process.exit(0);
  } catch (error) {
    console.error('Error creating super user:', error);
    process.exit(1);
  }
}

createSuperUser();
