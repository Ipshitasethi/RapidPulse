import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCx2ozvGmid95In4w6crqY1lafXgkf2Dgs",
  authDomain: "rapidpulse-2k26.firebaseapp.com",
  projectId: "rapidpulse-2k26",
  storageBucket: "rapidpulse-2k26.firebasestorage.app",
  messagingSenderId: "357700925117",
  appId: "1:357700925117:web:0c8e66b6b083ced434a9d4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Check if messaging is supported in this environment
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('Firebase Messaging not supported in this environment:', err);
}

export { messaging };
export default app;
