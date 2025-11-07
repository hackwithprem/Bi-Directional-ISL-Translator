// =============================
// IMPORT FIREBASE MODULES
// =============================
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// =============================
// SHOW MESSAGE FUNCTION
// =============================
function showMessage(message, type) {
  const existing = document.querySelector(".message");
  if (existing) existing.remove();

  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = message;

  const form = document.querySelector("form");
  form.parentNode.insertBefore(msg, form);

  setTimeout(() => msg.remove(), 4000);
}

// =============================
// HANDLE LOGIN (Firebase)
// =============================
window.handleLogin = async function (event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    showMessage("Please fill in all fields", "error");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage("Login successful! Redirecting...", "success");

    // ✅ Redirect to Flask /mode page after short delay
    setTimeout(() => {
      window.location.href = "/mode";
    }, 1500);
  } catch (error) {
    let msg = "Login failed. Please try again.";
    if (error.code === "auth/invalid-email") msg = "Invalid email format.";
    else if (error.code === "auth/user-not-found") msg = "User not found.";
    else if (error.code === "auth/wrong-password") msg = "Incorrect password.";

    showMessage(msg, "error");
  }
};

// =============================
// HANDLE SIGNUP (Firebase)
// =============================
window.handleSignup = async function (event) {
  event.preventDefault();

  const name = document.getElementById("signup-name")?.value.trim();
  const email = document.getElementById("signup-email")?.value.trim();
  const password = document.getElementById("signup-password")?.value.trim();
  const confirm = document.getElementById("signup-confirm")?.value.trim();

  if (!name || !email || !password || !confirm) {
    showMessage("Please fill in all fields", "error");
    return;
  }

  if (password.length < 8) {
    showMessage("Password must be at least 8 characters long", "error");
    return;
  }

  if (password !== confirm) {
    showMessage("Passwords do not match", "error");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showMessage("Account created successfully! Redirecting to login...", "success");

    // ✅ Redirect to login page after signup
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  } catch (error) {
    let msg = "Signup failed. Please try again.";
    if (error.code === "auth/email-already-in-use") msg = "Email already in use.";
    else if (error.code === "auth/invalid-email") msg = "Invalid email address.";

    showMessage(msg, "error");
  }
};

// =============================
// CHECK AUTH STATE
// =============================
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
  } else {
    console.log("❌ Not logged in");
  }
});

// =============================
// LOGOUT FUNCTION
// =============================
window.handleLogout = async function () {
  try {
    await signOut(auth);
    showMessage("Logged out successfully!", "success");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  } catch (error) {
    showMessage("Error logging out. Please try again.", "error");
  }
};
