declare global {
  interface Window {
    google: any;
  }
}


import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { apiFetch } from "../apiClient";

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

    const endpoint = "/auth/google-login";

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
      <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 py-8">
        {/* Logo and slogan */}
        <div className="mb-8 flex flex-col items-center">
          <img
            src="/ypropel-logo.png"
            alt="YPropel Logo"
            className="w-32 h-32 mb-2"
          />
          <h2 className="text-xl font-semibold text-blue-900">
            Propel Your Future. Connect. Learn. Succeed.
          </h2>
          <h2>YPropel Students x graduates professional platform</h2>
        </div>

        {/* Main auth + info container */}
        <div className="max-w-4xl w-full bg-white shadow-md rounded-md p-8 flex flex-col md:flex-row gap-8">
          {/* Left panel: Value proposition */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-semibold text-blue-900 mb-4">
              A professional network made for students & early career pros
            </h1>
            <p className="text-gray-700 mb-6">
              Join YPropel to connect with peers, access exclusive internships,
              and build the career you want — all in one supportive community.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>Network with fellow students and young professionals</li>
              <li>Discover tailored internships and freelance gigs</li>
              <li>Access career resources and mini-courses</li>
            </ul>
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => setView(AuthView.Login)}
                className="text-blue-700 font-semibold hover:underline"
              >
                Log in here
              </button>
              .
            </p>
          </div>

          {/* Right panel: Auth forms */}
          <div className="flex-1 max-w-md">
            {/* Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <button
                onClick={() => setView(AuthView.Login)}
                className={`flex-1 py-3 text-center font-semibold ${
                  view === AuthView.Login
                    ? "border-b-4 border-blue-900 text-blue-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                type="button"
              >
                Log In
              </button>
              <button
                onClick={() => setView(AuthView.SignUp)}
                className={`flex-1 py-3 text-center font-semibold ${
                  view === AuthView.SignUp
                    ? "border-b-4 border-blue-900 text-blue-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                type="button"
              >
                Sign Up
              </button>
            </div>

            {/* Forms */}
            {view === AuthView.Login && (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={loginData.email}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-900 text-white py-3 rounded"
                  >
                    Log In
                  </button>
                </form>
                <div
                  className="mt-4 text-center text-sm text-blue-700 hover:underline cursor-pointer"
                  onClick={() => setView(AuthView.ForgotPassword)}
                >
                  Forgot Password?
                </div>
                <div id="googleSignInDiv" className="mt-6 flex justify-center"></div>
              </>
            )}

            {view === AuthView.SignUp && (
              <>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={signUpData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={signUpData.email}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={signUpData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded"
                  />
                  <select
                    name="experienceLevel"
                    value={signUpData.experienceLevel}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border border-gray-300 rounded"
                  >
                    <option value="">Select your level of experience</option>
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full bg-blue-900 text-white py-3 rounded"
                  >
                    Sign Up
                  </button>
                </form>
                <div id="googleSignUpDiv" className="mt-6 flex justify-center"></div>
              </>
            )}

            {view === AuthView.ForgotPassword && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotEmail}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-900 text-white py-3 rounded"
                >
                  Send Reset Link
                </button>
                <div className="text-center text-sm mt-2">
                  Remember your password?{" "}
                  <button
                    className="text-blue-700 hover:underline font-semibold"
                    onClick={() => setView(AuthView.Login)}
                    type="button"
                  >
                    Log In
                  </button>
                  .
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Feature highlights section - row 1 */}
        <section className="max-w-4xl w-full mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-gray-700">
          <div className="p-4 border rounded shadow-sm hover:shadow-md transition">
            <div className="mb-4 text-blue-900 text-4xl">👥</div>
            <h3 className="text-lg font-semibold mb-2">Build Your Network</h3>
            <p>Connect with students, mentors, and professionals worldwide.</p>
          </div>
          <div className="p-4 border rounded shadow-sm hover:shadow-md transition">
            <div className="mb-4 text-blue-900 text-4xl">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Find Opportunities</h3>
            <p>Access internships, freelance gigs, and entry-level jobs tailored to you.</p>
          </div>
          <div className="p-4 border rounded shadow-sm hover:shadow-md transition">
            <div className="mb-4 text-blue-900 text-4xl">📚</div>
            <h3 className="text-lg font-semibold mb-2">Grow Your Skills</h3>
            <p>Explore career resources, mini-courses, and expert advice to succeed.</p>
          </div>
        </section>

        {/* Feature highlights section - row 2 */}
        <section className="max-w-4xl w-full mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-gray-700">
          <div className="p-4 border rounded shadow-sm hover:shadow-md transition">
            <div className="mb-4 text-blue-900 text-4xl">💬</div>
            <h3 className="text-lg font-semibold mb-2">Discussion Board & Study Circles</h3>
            <p>Collaborate, discuss, and grow with your peers in dedicated communities.</p>
          </div>
          <div className="p-4 border rounded shadow-sm hover:shadow-md transition">
            <div className="mb-4 text-blue-900 text-4xl">🏫</div>
            <h3 className="text-lg font-semibold mb-2">University & Resources</h3>
            <p>Access university info, career advice, and valuable student resources.</p>
          </div>
          <div className="p-4 border rounded shadow-sm hover:shadow-md transition">
            <div className="mb-4 text-blue-900 text-4xl">🛒</div>
            <h3 className="text-lg font-semibold mb-2">Marketplace (Coming Soon!)</h3>
            <p>Buy, sell, or trade textbooks, services, and student essentials.</p>
          </div>
        </section>
      </div>
    </>
  );
}
