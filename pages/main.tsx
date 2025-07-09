import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { apiFetch } from "../apiClient"; // Updated import path (no utils)

enum AuthView {
  Login = "login",
  SignUp = "signup",
  ForgotPassword = "forgotPassword",
}

// ... rest of your code unchanged ...

export default function LandingPage() {
  // your existing component code here

  // Replace all fetch calls with apiFetch as in your original code

  // ...
}
