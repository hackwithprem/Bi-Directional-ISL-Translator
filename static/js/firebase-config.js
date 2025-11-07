// Import the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDu95sX3V2OGl0nnIct4C7f1I-tYgraC1M",
  authDomain: "csp-54e15.firebaseapp.com",
  projectId: "csp-54e15",
  storageBucket: "csp-54e15.firebasestorage.app",
  messagingSenderId: "1029818482983",
  appId: "1:1029818482983:web:f20d266ea0b82eb5f4e902"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
