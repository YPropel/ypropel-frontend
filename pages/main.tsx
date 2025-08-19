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
// Cloudinary static images (paste your exact secure URLs)

// Cloudinary static images
const PITCHPOINT_IMG =
  "https://res.cloudinary.com/denggbgma/image/upload/pexels-olly-3783839_zcfasg.jpg";

const VIDEOS_IMG =
  "https://res.cloudinary.com/denggbgma/image/upload/pexels-sam-lion-6001235_bppg12.jpg";



export default function LandingPage() {
  const [view, setView] = useState<AuthView>(AuthView.SignUp); // default to Sign Up for conversion
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    name: "", email: "", password: "", confirmPassword: "", experienceLevel: ""
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  //----------
  // ---- Redirect helpers ----
const getRedirectTarget = () => {
  if (typeof window === "undefined") return "/";
  const qs = new URLSearchParams(window.location.search);
  const fromQuery = qs.get("redirect");
  const fromSession = sessionStorage.getItem("returnTo");
  const candidate = fromQuery || fromSession || "/";
  // prevent open redirects: only allow same-site relative paths
  return candidate.startsWith("/") ? candidate : "/";
};

const finishLogin = () => {
  const target = getRedirectTarget();
  try { sessionStorage.removeItem("returnTo"); } catch {}
  router.replace(target);
};

useEffect(() => {
  if (typeof window === "undefined") return;
  const qs = new URLSearchParams(window.location.search);
  const v = qs.get("view");
  if (v === "signup") setView(AuthView.SignUp);
  if (v === "login") setView(AuthView.Login);
}, []);

  // ----------- NEW: demo data (replace with API calls later) -----------
  const newsItems = [
    { tag: "AI", title: "Resume scanners now prefer concrete metrics", time: "2h ago" },
    { tag: "Careers", title: "Top 5 internship interview questions this week", time: "6h ago" },
    { tag: "Productivity", title: "Study sprint: 45/15 beats 25/5 for most students", time: "1d ago" },
  ];
  const hourlyJobs = [
    { role: "Lab Assistant (On-Campus)", pay: "$14–$18/hr", location: "Nearby", type: "Part-time" },
    { role: "Math Tutor (HS Students)", pay: "$18–$22/hr", location: "Remote", type: "Hourly" },
    { role: "Front Desk (Community Center)", pay: "$13–$16/hr", location: "Local", type: "Evenings" },
  ];
  const studyCircles = [
    { name: "Intro to Python", cadence: "2x/week", members: 124 },
    { name: "SAT/ACT Verbal", cadence: "3x/week", members: 89 },
    { name: "UX Portfolio Club", cadence: "Weekly", members: 64 },
  ];

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
      //router.push("/");
      window.dispatchEvent(new Event("login"));
finishLogin();

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
      ///router.push("/");
      window.dispatchEvent(new Event("login"));
finishLogin();

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
      //router.push("/");
      window.dispatchEvent(new Event("login"));
finishLogin();

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
            <a href="#circles" className="hover:text-blue-900">Study Circles</a>
            <a href="#news" className="hover:text-blue-900">News</a>
            <a href="#jobs" className="hover:text-blue-900">Hourly Jobs</a>
            <a href="#pitchpoint" className="hover:text-blue-900">PitchPoint</a>
            <a href="#videos" className="hover:text-blue-900">Videos</a>
            <a href="#why" className="hover:text-blue-900">Why Us</a>
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

          {/* Auth Card */}
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

      {/* High-level Features */}
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

      {/* Study Circles / Discussion Board */}
      <section id="circles" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold text-blue-900">Discussion Board & Study Circles</h2>
            <p className="mt-3 text-gray-700">
              Collaborate with peers in focused groups. Ask questions, share notes, and keep each other accountable.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>Topic channels for courses, majors, interview prep</li>
              <li>Study Circles with goals, schedules, and progress tracking</li>
              <li>Moderated, supportive spaces — no noise, no spam</li>
            </ul>
            <button onClick={scrollToForm}
              className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3">
              Join a Study Circle
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {studyCircles.map((c) => (
              <div key={c.name} className="p-4 border rounded-xl bg-gray-50">
                <h3 className="font-semibold text-blue-900">{c.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Cadence: {c.cadence}</p>
                <p className="text-sm text-gray-600">Members: {c.members}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily News & Updates */}
      <section id="news" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold text-blue-900 text-center">Daily, Relevant & Distraction-Free</h2>
          <p className="mt-2 text-center text-gray-700">
            Student-friendly summaries of news that impacts your studies, internships, and early career.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((n, idx) => (
              <article key={idx} className="p-6 bg-white border rounded-xl hover:shadow-md transition">
                <span className="inline-block text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded">{n.tag}</span>
                <h3 className="mt-3 font-semibold text-blue-900">{n.title}</h3>
                <p className="mt-2 text-xs text-gray-500">{n.time}</p>
                <button onClick={scrollToForm}
                  className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Get full access →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Hourly Jobs for HS Students */}
      <section id="jobs" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold text-blue-900">Hourly Jobs for High-School Students</h2>
            <p className="mt-3 text-gray-700">
              Flexible, student-safe listings to help you earn experience (and money) while in school.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>Curated by relevance and safety</li>
              <li>Local & remote options with evening/weekend shifts</li>
              <li>Simple applications + resume tips included</li>
            </ul>
            <button onClick={scrollToForm}
              className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3">
              Browse Hourly Jobs
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {hourlyJobs.map((j) => (
              <div key={j.role} className="p-4 border rounded-xl bg-gray-50">
                <h3 className="font-semibold text-blue-900">{j.role}</h3>
                <p className="text-sm text-gray-600 mt-1">{j.pay}</p>
                <p className="text-sm text-gray-600">{j.location} • {j.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PitchPoint Video Hub */}
<section id="pitchpoint" className="bg-gray-50">
  <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-center">{/* 1 */}
    <div>{/* 2 */}
      <h2 className="text-3xl font-bold text-blue-900">PitchPoint: Your Video Elevator Pitch</h2>
      <p className="mt-3 text-gray-700">
        Record a short video to showcase your skills, projects, and story — then share it with employers and universities.
      </p>
      <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
        <li>Clean, distraction-free viewer page</li>
        <li>Auto-generated cover + easy sharing</li>
        <li>Tips &amp; examples to nail your pitch</li>
      </ul>
      <button
        onClick={scrollToForm}
        className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
      >
        Create My Pitch
      </button>
    </div>{/* /2 */}

    <div className="aspect-square bg-white border rounded-xl overflow-hidden">{/* 3 */}
      <img
        src={PITCHPOINT_IMG}
        alt="PitchPoint preview"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>{/* /3 */}
  </div>{/* /1 */}
</section>



      {/* Educational Videos (Distraction-Free) */}
      <section id="videos" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold text-blue-900">Educational Videos without the Noise</h2>
            <p className="mt-3 text-gray-700">
              We curate the best how-tos and lectures from around the web and present them in a focused player — no comments,
              no autoplay rabbit holes, just learning.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>Topic playlists: coding, design, AI, career prep</li>
              <li>Time-boxed modules with notes & key takeaways</li>
              <li>Save to your queue; discuss in Study Circles</li>
            </ul>
            <button onClick={scrollToForm}
              className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3">
              Start Learning
            </button>
          </div>
          <div className="aspect-video bg-gray-50 border rounded-xl grid place-items-center text-gray-400">
            <span className="text-sm">Video player preview</span>
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section id="why" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold text-blue-900 text-center">What Makes YPropel Different</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Built for Students", desc: "Everything targets your stage — not mid-career noise." },
              { title: "Distraction-Free", desc: "Curated news & videos, clean viewing, zero spam." },
              { title: "Action First", desc: "Study Circles, hourly jobs, and PitchPoint to get results fast." },
            ].map((b) => (
              <div key={b.title} className="p-6 bg-white border rounded-xl">
                <h3 className="font-semibold text-blue-900">{b.title}</h3>
                <p className="mt-2 text-gray-700">{b.desc}</p>
              </div>
            ))}
          </div>
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

      {/* Expanded FAQ */}
      <section id="faq" className="bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-2xl font-bold text-blue-900 text-center">FAQ</h2>
          <div className="mt-6 divide-y divide-gray-200 border rounded-xl bg-white">
            {[
              { q:"Is YPropel free?", a:"Yes. You can join free and upgrade later if you want more features." },
              { q:"Who is YPropel for?", a:"High school & university students, recent grads, and early-career professionals." },
              { q:"How long does sign-up take?", a:"Less than 60 seconds. Continue with Google for the fastest start." },
              { q:"What are Study Circles?", a:"Small, goal-oriented groups with cadence, shared resources, and progress tracking." },
              { q:"What is PitchPoint?", a:"A clean video hub to host your short pitch—share it with employers and universities." },
              { q:"Do you list hourly jobs for HS students?", a:"Yes. Curated, student-safe roles with simple applications." },
              { q:"How is YPropel different from other platforms?", a:"We remove distractions, target student needs only, and help you act: circles, jobs, pitch videos, and curated learning." },
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
