import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// =============================
// LOGOUT FUNCTIONALITY
// =============================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("You have been logged out!");
      window.location.href = "/"; // ✅ Flask route for login
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Error logging out. Please try again.");
    }
  });
}

// =============================
// REDIRECT LOGIC
// =============================
const signToText = document.getElementById("signToText");
if (signToText) {
  signToText.addEventListener("click", () => {
    window.location.href = "/signToText"; // Flask route
  });
}

const textToSign = document.getElementById("textToSign");
if (textToSign) {
  textToSign.addEventListener("click", () => {
    window.location.href = "/textToSign"; // Flask route
  });
}
