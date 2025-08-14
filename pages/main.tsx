/* eslint-disable @next/next/no-img-element */
declare global {
  interface Window { google: any }
}

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { apiFetch } from "../apiClient";

enum AuthView { Login = "login", SignUp = "signup", ForgotPassword = "forgotPassword" }

const GOOGLE_CLIENT_ID = "914673158285-2kvn5lcd073aflv4smut843b1jh74k6t.apps.googleusercontent.com";

export default function LandingPage() {
  const [view, setView] = useState<AuthView>(AuthView.SignUp); // default to SignUp to boost conversions
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    name: "", email: "", password: "", confirmPassword: "", experienceLevel: ""
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const experienceLevels = [
    "University/College Student","High School Student","Vocational Student (Trade School)",
    "Postgraduate Student (Master’s/PhD)","Graduate","Entry-Level Professional",
    "Mid-Level Professional","Experienced","Other",
  ];

  // ---------- Input handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (view === AuthView.Login) setLoginData((p) => ({ ...p, [name]: value }));
    else if (view === AuthView.SignUp) setSignUpData((p) => ({ ...p, [name]: value }));
    else setForgotEmail(value);
  };

  // ---------- Google callbacks ----------
  const handleGoogleCallback = (response: any) => {
    handleGoogleResponse(response, view === AuthView.Login ? "login" : "signup");
  };

  const handleGoogleResponse = async (response: any, mode: "login" | "signup") => {
    const idToken = response.credential;
    if (!idToken) { alert("Google sign-in failed: no token received"); return; }
    const endpoint = "/auth/google-login";
    try {
      const res = await apiFetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: idToken }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`${mode === "login" ? "Google login" : "Google signup"} failed: ${err.error || "Unknown error"}`);
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");
      if (data.isNewUser && mode === "signup") alert(`Welcome ${data.user.name}!`);
      window.dispatchEvent(new Event("login"));
      router.push("/");
    } catch (error) {
      alert(`${mode === "login" ? "Google login" : "Google signup"} error: ${(error as Error).message}`);
    }
  };

  // ---------- Initialize Google button per view ----------
  useEffect(() => {
    if (typeof window !== "undefined" && window.google) {
      const loginDiv = document.getElementById("googleSignInDiv");
      const signUpDiv = document.getElementById("googleSignUpDiv");
      if (loginDiv) loginDiv.innerHTML = "";
      if (signUpDiv) signUpDiv.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCallback,
      });

      const opts = { theme: "outline", size: "large", width: 280 };
      if (view === AuthView.Login && loginDiv) window.google.accounts.id.renderButton(loginDiv, opts);
      if (view === AuthView.SignUp && signUpDiv) window.google.accounts.id.renderButton(signUpDiv, opts);
    }
  }, [view]);

  // ---------- Auth handlers ----------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/auth/signin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      if (!res.ok) { const err = await res.json(); alert(`Login failed: ${err.error || "Unknown error"}`); return; }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");
      window.dispatchEvent(new Event("login"));
      router.push("/");
    } catch (error) { alert(`Login error: ${(error as Error).message}`); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) { alert("Passwords do not match!"); return; }
    if (!signUpData.experienceLevel) { alert("Please select your level of experience!"); return; }
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signUpData.name, email: signUpData.email,
          password: signUpData.password, experience_level: signUpData.experienceLevel,
        }),
      });
      if (!res.ok) { const err = await res.json(); alert(`Sign-up failed: ${err.error || "Unknown error"}`); return; }
      const data = await res.json();
      alert(`Account created! Welcome ${data.user.name}`);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");
      window.dispatchEvent(new Event("login"));
      router.push("/");
    } catch (error) { alert(`Sign-up error: ${(error as Error).message}`); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset link");
      alert(`Password reset link sent to ${forgotEmail}`);
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };

  // ---------- Helpers ----------
  const scrollToForm = () => {
    setView(AuthView.SignUp);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/ypropel-logo.png" alt="YPropel" className="h-9 w-9" />
            <span className="font-semibold text-blue-900">YPropel</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
            <a href="#features" className="hover:text-blue-900">Features</a>
            <a href="#community" className="hover:text-blue-900">Community</a>
            <a href="#faq" className="hover:text-blue-900">FAQ</a>
          </nav>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-white font-semibold
            bg-emerald-600 hover:bg-emerald-700 transition"
            aria-label="Join YPropel for free"
          >
            Join Free
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900">
              Where Students & Graduates <span className="text-emerald-600">Launch Careers</span>
            </h1>
            <p className="mt-4 text-gray-700 text-lg">
              Connect with peers, land real opportunities, and grow your skills — all in one community built for you.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={scrollToForm}
                className="w-full sm:w-auto rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
              >
                Join Free in 60s
              </button>
              <button
                onClick={() => { setView(AuthView.SignUp); setTimeout(() => {
                  const el = document.getElementById("googleSignUpDiv");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 0); }}
                className="w-full sm:w-auto rounded-lg border border-gray-300 hover:border-blue-900 text-blue-900 font-semibold px-6 py-3 bg-white"
              >
                Continue with Google
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">No spam. Cancel anytime.</p>
          </div>

          {/* Auth Card (SignUp/Login/Forgot) */}
          <div ref={formRef} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex mb-5 border-b border-gray-200">
              <button
                onClick={() => setView(AuthView.SignUp)}
                className={`flex-1 py-3 text-center font-semibold ${
                  view === AuthView.SignUp ? "border-b-4 border-blue-900 text-blue-900" : "text-gray-500 hover:text-gray-700"
                }`}
                type="button"
                aria-current={view === AuthView.SignUp}
              >
                Sign Up
              </button>
              <button
                onClick={() => setView(AuthView.Login)}
                className={`flex-1 py-3 text-center font-semibold ${
                  view === AuthView.Login ? "border-b-4 border-blue-900 text-blue-900" : "text-gray-500 hover:text-gray-700"
                }`}
                type="button"
                aria-current={view === AuthView.Login}
              >
                Log In
              </button>
            </div>

            {view === AuthView.SignUp && (
              <>
                <form onSubmit={handleSignUp} className="space-y-3">
                  <input type="text" name="name" placeholder="Full name" value={signUpData.name}
                    onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded" />
                  <input type="email" name="email" placeholder="Email address" value={signUpData.email}
                    onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="password" name="password" placeholder="Create a password" value={signUpData.password}
                      onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded" />
                    <input type="password" name="confirmPassword" placeholder="Confirm password"
                      value={signUpData.confirmPassword} onChange={handleChange} required
                      className="w-full p-3 border border-gray-300 rounded" />
                  </div>
                  <select name="experienceLevel" value={signUpData.experienceLevel}
                    onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded">
                    <option value="">Select your level of experience</option>
                    {experienceLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                  <button type="submit" className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded font-semibold">
                    Create my account
                  </button>
                </form>
                <div className="mt-4">
                  <div id="googleSignUpDiv" className="flex justify-center"></div>
                </div>
                <p className="mt-3 text-center text-xs text-gray-500">
                  By joining you agree to our Terms & Privacy. No spam. Cancel anytime.
                </p>
              </>
            )}

            {view === AuthView.Login && (
              <>
                <form onSubmit={handleLogin} className="space-y-3">
                  <input type="email" name="email" placeholder="Email address" value={loginData.email}
                    onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded" />
                  <input type="password" name="password" placeholder="Password" value={loginData.password}
                    onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded" />
                  <button type="submit" className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded font-semibold">
                    Log In
                  </button>
                </form>
                <div
                  className="mt-4 text-center text-sm text-blue-700 hover:underline cursor-pointer"
                  onClick={() => setView(AuthView.ForgotPassword)}
                >
                  Forgot Password?
                </div>
                <div id="googleSignInDiv" className="mt-4 flex justify-center"></div>
              </>
            )}

            {view === AuthView.ForgotPassword && (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input type="email" placeholder="Enter your email address" value={forgotEmail}
                  onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded" />
                <button type="submit" className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded font-semibold">
                  Send Reset Link
                </button>
                <div className="text-center text-sm mt-2">
                  Remember your password?{" "}
                  <button className="text-blue-700 hover:underline font-semibold" onClick={() => setView(AuthView.Login)} type="button">
                    Log In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 items-center text-center">
          <div className="text-sm text-gray-500">Trusted by <span className="font-semibold text-blue-900">2,000+</span> students</div>
          <div className="text-sm text-gray-500">Internships posted weekly</div>
          <div className="text-sm text-gray-500">Mentors & peers worldwide</div>
          <div className="text-sm text-gray-500">Fast, supportive community</div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { icon:"👥", title:"Build Your Network", desc:"Connect with students, mentors, and young professionals." },
            { icon:"🎯", title:"Find Opportunities", desc:"Internships, freelance gigs, and entry-level roles tailored to you." },
            { icon:"📚", title:"Grow Your Skills", desc:"Career resources, mini-courses, and expert advice." },
          ].map((f) => (
            <div key={f.title} className="p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition">
              <div className="mb-3 text-blue-900 text-4xl">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-gray-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="community" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-blue-900 text-center">What Members Say</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name:"Sara, CS Student", quote:"I landed my first paid internship through YPropel in 3 weeks." },
              { name:"Leo, Grad", quote:"Finally a platform that’s not overwhelming—super targeted for us." },
              { name:"Amira, HS Senior", quote:"The community helped me choose a major and build a starter portfolio." },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl border bg-gray-50">
                <p className="text-gray-800 italic">“{t.quote}”</p>
                <p className="mt-3 text-sm font-semibold text-blue-900">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-2xl font-bold text-blue-900 text-center">FAQ</h2>
          <div className="mt-6 divide-y divide-gray-200 border rounded-xl bg-white">
            {[
              { q:"Is YPropel free?", a:"Yes. You can join free and upgrade later if you want more features." },
              { q:"Who is YPropel for?", a:"High school & university students, recent grads, and early-career professionals." },
              { q:"How long does sign-up take?", a:"Less than 60 seconds. Continue with Google for the fastest start." },
            ].map((item) => (
              <details key={item.q} className="p-5 group">
                <summary className="cursor-pointer font-semibold text-blue-900 flex justify-between items-center">
                  {item.q} <span className="text-gray-400 group-open:rotate-180 transition">⌄</span>
                </summary>
                <p className="mt-2 text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-900">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold">Ready to launch your future?</h2>
          <p className="mt-2 text-blue-100">Join the student & graduate community built to help you succeed.</p>
          <button
            onClick={scrollToForm}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-3 font-semibold"
          >
            Join YPropel Free
          </button>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-6 justify-between">
          <p>© {new Date().getFullYear()} YPropel. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="hover:text-blue-900" href="/terms">Terms</a>
            <a className="hover:text-blue-900" href="/privacy">Privacy</a>
            <a className="hover:text-blue-900" href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
