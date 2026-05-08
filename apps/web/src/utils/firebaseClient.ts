// Firebase Storage client — kept around solely so legacy avatar /
// banner Media rows (host=FIREBASE) can still be resolved by
// `api2/storage.ts`. Once those legacy rows are migrated to R2 (or
// purged), this file plus the `firebase` dependency can go.
//
// Lazy-loaded: api2/storage.ts only imports this when it sees a
// FIREBASE-host row. Bundles that don't touch legacy media never
// pull Firebase in.

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const clientCredentials = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebase = initializeApp(clientCredentials);
const storage = getStorage(firebase);

export { firebase, storage };
export default firebase;
