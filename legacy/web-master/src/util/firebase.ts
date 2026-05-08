// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Firebase Common Components (to simplify imports)

// Import the functions you need from the SDKs you need
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

console.log(process.env);
  
const app = initializeApp(
  {
    'apiKey': process.env.REACT_APP_API_KEY,
    'authDomain': process.env.REACT_APP_AUTH_DOMAIN,
    'databaseURL': process.env.REACT_APP_DATABASE_URL,
    'projectId': process.env.REACT_APP_PROJECT_ID,
    'storageBucket': process.env.REACT_APP_STORAGE_BUCKET,
    'messagingSenderId': process.env.REACT_APP_MESSAGING_SENDER_ID,
    'appId': process.env.REACT_APP_APP_ID,
    'measurementId': process.env.REACT_APP_MEASUREMENT_ID,
  },
);

// Run function emulator
if (process.env.REACT_APP_TYPE === 'local') {
  const functions = getFunctions();
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

const auth = getAuth(app);
const db = getFirestore(app);
const rt = getDatabase(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

const envType = process.env.REACT_APP_TYPE;

export {
  app,
  auth,
  db,
  rt,
  storage,
  analytics,
  envType,
};

export default app;



