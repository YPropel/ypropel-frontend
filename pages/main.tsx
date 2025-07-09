import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { apiFetch } from "../apiClient"; // Adjusted import for root folder

enum AuthView {
  Login = "login",
  SignUp = "signup",
  ForgotPassword = "forgotPassword",
}

const GOOGLE_CLIENT_ID =
  "914673158285-2kvn5lcd073aflv4smut843b1jh74k6t.apps.googleusercontent.com";

export default function LandingPage() {
  const [view, setView] = useState<AuthView>(AuthView.Login);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    experienceLevel: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  const router = useRouter();

  const experienceLevels = [
    "University/College Student",
    "High School Student",
    "Vocational Student (Trade School)",
    "Postgraduate Student (Master’s/PhD)",
    "Graduate",
    "Entry-Level Professional",
    "Mid-Level Professional",
    "Experienced",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (view === AuthView.Login) {
      setLoginData((prev) => ({ ...prev, [name]: value }));
    } else if (view === AuthView.SignUp) {
      setSignUpData((prev) => ({ ...prev, [name]: value }));
    } else if (view === AuthView.ForgotPassword) {
      setForgotEmail(value);
    }
  };

  // Google callback handler
  const handleGoogleCallback = (response: any) => {
    handleGoogleResponse(response, view === AuthView.Login ? "login" : "signup");
  };

  const handleGoogleResponse = async (
    response: any,
    mode: "login" | "signup"
  ) => {
    const idToken = response.credential;
    if (!idToken) {
      alert("Google sign-in failed: no token received");
      return;
    }

    const endpoint =
      mode === "login"
        ? "/auth/google-login"
        : "/auth/google-signup";

    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: idToken }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(
          `${mode === "login" ? "Google login" : "Google signup"} failed: ${
            err.error || "Unknown error"
          }`
        );
        return;
      }

      const data = await res.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");

      if (data.isNewUser && mode === "signup") {
        alert(`Welcome new user, ${data.user.name}! Your account has been created.`);
      } else if (mode === "login") {
        alert(`Welcome back, ${data.user.name}! You are logged in.`);
      }

      window.dispatchEvent(new Event("login"));
      router.push("/");
    } catch (error) {
      alert(
        `${mode === "login" ? "Google login" : "Google signup"} error: ${
          (error as Error).message
        }`
      );
    }
  };

  // Initialize Google Identity Services and render button based on view
  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      const loginDiv = document.getElementById("googleSignInDiv");
      const signUpDiv = document.getElementById("googleSignUpDiv");
      if (loginDiv) loginDiv.innerHTML = "";
      if (signUpDiv) signUpDiv.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });

      if (view === AuthView.Login && loginDiv) {
        window.google.accounts.id.renderButton(loginDiv, {
          theme: "outline",
          size: "large",
          width: 250,
        });
      } else if (view === AuthView.SignUp && signUpDiv) {
        window.google.accounts.id.renderButton(signUpDiv, {
          theme: "outline",
          size: "large",
          width: 250,
        });
      }
    }
  }, [view]);

  // Regular email/password login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await apiFetch("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Login failed: ${err.error || "Unknown error"}`);
        return;
      }

      const data = await res.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");

      window.dispatchEvent(new Event("login"));
      router.push("/");
    } catch (error) {
      alert(`Login error: ${(error as Error).message}`);
    }
  };

  // Sign up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signUpData.password !== signUpData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!signUpData.experienceLevel) {
      alert("Please select your level of experience!");
      return;
    }

    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpData.name,
          email: signUpData.email,
          password: signUpData.password,
          experience_level: signUpData.experienceLevel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Sign-up failed: ${err.error || "Unknown error"}`);
        return;
      }

      const data = await res.json();
      alert(`Account created successfully! Welcome ${data.user.name}`);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");

      window.dispatchEvent(new Event("login"));
      router.push("/");
    } catch (error) {
      alert(`Sign-up error: ${(error as Error).message}`);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      alert(`Password reset link sent to ${forgotEmail}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      {/* Your existing JSX content here, unchanged */}
    </>
  );
}
