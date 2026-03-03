import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBdr1_hXWfM1dS5pYEzb-gEyFJoQAjYVvI",
  authDomain: "ncc-sairam-website.firebaseapp.com",
  projectId: "ncc-sairam-website",
  storageBucket: "ncc-sairam-website.firebasestorage.app",
  messagingSenderId: "907547319648",
  appId: "1:907547319648:web:5298912ef670dda9431205"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// High-performance persistent cache — makes the site feel "offline-first" and instant on repeat visits
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});

const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, analytics };