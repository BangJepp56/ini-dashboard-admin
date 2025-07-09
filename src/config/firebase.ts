import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZLKMW6fxTOlEOeimm1xfXsqVztHo4qKg",
  authDomain: "prima-qonita-470ec.firebaseapp.com",
  projectId: "prima-qonita-470ec",
  storageBucket: "prima-qonita-470ec.appspot.com",
  messagingSenderId: "5948265773",
  appId: "1:5948265773:web:a753bda69d953e9291afa4",
  measurementId: "G-C033EF73KP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);