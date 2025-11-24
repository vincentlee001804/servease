// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Debug: Log if API key is missing (only in development)
if (process.env.NODE_ENV !== 'production') {
  if (!firebaseConfig.apiKey) {
    console.error('❌ REACT_APP_FIREBASE_API_KEY is missing! Check your .env file.');
  } else {
    console.log('✅ Firebase API Key loaded:', firebaseConfig.apiKey.substring(0, 10) + '...');
  }
  if (!firebaseConfig.authDomain) {
    console.error('❌ REACT_APP_FIREBASE_AUTH_DOMAIN is missing!');
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const shouldEnableAppCheck =
  process.env.REACT_APP_ENABLE_APPCHECK !== 'false';

if (process.env.NODE_ENV !== 'production') {
  console.log(
    `App Check enabled: ${shouldEnableAppCheck} (REACT_APP_ENABLE_APPCHECK=${process.env.REACT_APP_ENABLE_APPCHECK})`
  );
}

// Enable App Check debug token for local development (optional)
const appCheckGlobal =
  typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : undefined;

if (
  shouldEnableAppCheck &&
  process.env.NODE_ENV !== 'production' &&
  appCheckGlobal
) {
  const debugToken = process.env.REACT_APP_APPCHECK_DEBUG_TOKEN;
  if (debugToken) {
    appCheckGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    console.log('Using App Check debug token');
  } else {
    console.warn(
      'App Check debug token not set. Set REACT_APP_APPCHECK_DEBUG_TOKEN in .env to re-use the same token.'
    );
  }
}

// Initialize App Check (reCAPTCHA v3) only if enabled
export const appCheck = shouldEnableAppCheck
  ? initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        process.env.REACT_APP_RECAPTCHA_SITE_KEY
      ),
      isTokenAutoRefreshEnabled: true,
    })
  : null;

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;

