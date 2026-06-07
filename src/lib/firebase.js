import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCCWO2yE3MWnBEah27tHRCsB6kZ9uFQAbU",
  authDomain: "fluorine-c64c4.firebaseapp.com",
  projectId: "fluorine-c64c4",
  storageBucket: "fluorine-c64c4.firebasestorage.app",
  messagingSenderId: "1089344500802",
  appId: "1:1089344500802:web:6abf80e9461b06a7fb29db",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
