import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
};

const app = initializeApp(firebaseConfig);

const firestore = getFirestore(app);

export async function setToken() {
  return setDoc(doc(firestore, 'test', 'testing'), {test: 'this is a test'})
}


// export getUser()

// await setDoc(doc(firestore, "characters", "mario"), {
//   employment: "plumber",
//   outfitColor: "red",
//   specialAttack: "fireball"
// });