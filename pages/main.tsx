/* eslint-disable @next/next/no-img-element */
declare global {
  interface Window {
    google: any;
  }
}

import React, { useEffect, useRef, useState } from "react";
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

// Cloudinary static images
const PITCHPOINT_IMG =
  "https://res.cloudinary.com/denggbgma/image/upload/pexels-olly-3783839_zcfasg.jpg";

const VIDEOS_IMG =
  "https://res.cloudinary.com/denggbgma/image/upload/pexels-sam-lion-6001235_bppg12.jpg";

// Demo content arrays
const newsItems = [
  {
    tag: "AI",
    title: "Resume scanners now prefer concrete metrics",
    time: "2h ago",
  },
  {
    tag: "Careers",
    title: "Top 5 internship interview questions this week",
    time: "6h ago",
  },
  {
    tag: "Productivity",
    title: "Study sprint: 45/15 beats 25/5 for most students",
    time: "1d ago",
  },
];

const hourlyJobsDemo = [
  {
    role: "Lab Assistant (On-Campus)",
    pay: "$14–$18/hr",
    location: "Nearby",
    type: "Part-time",
  },
  {
    role: "Math Tutor (HS Students)",
    pay: "$18–$22/hr",
    location: "Remote",
    type: "Hourly",
  },
  {
    role: "Front Desk (Community Center)",
    pay: "$13–$16/hr",
    location: "Local",
    type: "Evenings",
  },
];

const studyCirclesDemo = [
  { name: "Intro to Python", cadence: "2x/week", members: 124 },
  { name: "SAT/ACT Verbal", cadence: "3x/week", members: 89 },
  { name: "UX Portfolio Club", cadence: "Weekly", members: 64 },
];

// ---------- Types from your routes ----------
interface Job {
  id: number;
  title?: string;
  position_name?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  job_type?: string;
  salary?: string;
  posted_at?: string;
  [key: string]: any;
}

interface Article {
  id: number;
  title: string;
  cover_image?: string;
  content?: string;
  total_likes?: number;
}

interface JobFair {
  id: number;
  name?: string;
  title?: string;
  location?: string;
  start_datetime?: string;
  end_datetime?: string;
  description?: string;
  [key: string]: any;
}

export default function LandingPage() {
  // ✅ Default to LOGIN tab now
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
  const formRef = useRef<HTMLDivElement>(null);

  // Content state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [jobFairs, setJobFairs] = useState<JobFair[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // ---- Redirect helpers ----
  const getRedirectTarget = () => {
    if (typeof window === "undefined") return "/";
    const qs = new URLSearchParams(window.location.search);
    const fromQuery = qs.get("redirect");
    const fromSession = sessionStorage.getItem("returnTo");
    const candidate = fromQuery || fromSession || "/";
    return candidate.startsWith("/") ? candidate : "/";
  };

  const finishLogin = () => {
    const target = getRedirectTarget();
    try {
      sessionStorage.removeItem("returnTo");
    } catch {}
    router.replace(target);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const v = qs.get("view");
    if (v === "signup") setView(AuthView.SignUp);
    if (v === "login") setView(AuthView.Login);
  }, []);

  // ----------- Experience levels -----------
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

  // ---------- Fetch preview content from your routes ----------
  useEffect(() => {
    const fetchContent = async () => {
      setLoadingContent(true);
      setContentError(null);
      try {
        const [jobsRes, articlesRes, fairsRes] = await Promise.all([
          apiFetch("/jobs"),
          apiFetch("/articles"),
          apiFetch("/job-fairs"),
        ]);

        if (jobsRes.ok) {
          const jobsJson = await jobsRes.json();
          setJobs(jobsJson || []);
        } else {
          console.error("Failed to fetch jobs");
        }

        if (articlesRes.ok) {
          const articlesJson = await articlesRes.json();
          setArticles(articlesJson || []);
        } else {
          console.error("Failed to fetch articles");
        }

        if (fairsRes.ok) {
          const fairsJson = await fairsRes.json();
          setJobFairs(fairsJson || []);
        } else {
          console.error("Failed to fetch job fairs");
        }
      } catch (err) {
        console.error("Error loading preview content:", err);
        setContentError("Unable to load preview content right now.");
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, []);

  // ---------- Input handlers ----------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (view === AuthView.Login) setLoginData((p) => ({ ...p, [name]: value }));
    else if (view === AuthView.SignUp)
      setSignUpData((p) => ({ ...p, [name]: value }));
    else setForgotEmail(value);
  };

  // ---------- Google callbacks ----------
  const handleGoogleCallback = (response: any) => {
    handleGoogleResponse(
      response,
      view === AuthView.Login ? "login" : "signup"
    );
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
          `${
            mode === "login" ? "Google login" : "Google signup"
          } failed: ${err.error || "Unknown error"}`
        );
        return;
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");
      if (data.isNewUser && mode === "signup")
        alert(`Welcome ${data.user.name}!`);
      window.dispatchEvent(new Event("login"));
      finishLogin();
    } catch (error) {
      alert(
        `${
          mode === "login" ? "Google login" : "Google signup"
        } error: ${(error as Error).message}`
      );
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
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });

      const opts = { theme: "outline", size: "large", width: 280 };
      if (view === AuthView.Login && loginDiv)
        window.google.accounts.id.renderButton(loginDiv, opts);
      if (view === AuthView.SignUp && signUpDiv)
        window.google.accounts.id.renderButton(signUpDiv, opts);
    }
  }, [view]);

  // ---------- Auth handlers ----------
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
      finishLogin();
    } catch (error) {
      alert(`Login error: ${(error as Error).message}`);
    }
  };

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
      alert(`Account created! Welcome ${data.user.name}`);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("role", data.user.is_admin ? "admin" : "user");
      window.dispatchEvent(new Event("login"));
      finishLogin();
    } catch (error) {
      alert(`Sign-up error: ${(error as Error).message}`);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset link");
      alert(`Password reset link sent to ${forgotEmail}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // ---------- Helpers ----------
  const scrollToForm = () => {
    setView(AuthView.SignUp);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      0
    );
  };

  const handleLockedClick = () => {
    scrollToForm();
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncate = (text: string | undefined, length: number) => {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.slice(0, length) + "…";
  };

  // ---- Job grouping helpers ----
  const normType = (job: Job) =>
    (job.job_type || "").toString().trim().toLowerCase();

  const internships = jobs.filter((j) => normType(j).includes("intern"));
  const entryLevel = jobs.filter((j) => normType(j).includes("entry"));
  const hourly = jobs.filter((j) => {
    const t = normType(j);
    return (
      t.includes("hour") ||
      t.includes("part-time") ||
      t.includes("part time")
    );
  });

  const fallbackJobs = (arr: Job[], count: number) =>
    (arr.length > 0 ? arr : jobs).slice(0, count);

  const internshipSample = fallbackJobs(internships, 3);
  const entryLevelSample = fallbackJobs(entryLevel, 3);
  const hourlySample = fallbackJobs(hourly, 3);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />

      {/* Simple header: logo only */}
      <header className="bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3">
          <img src="/ypropel-logo.png" alt="YPropel" className="h-8 w-8" />
          <span className="font-semibold text-blue-900 text-sm">YPropel</span>
        </div>
      </header>

      {/* Hero – left: title + paragraph only; right: auth card */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8 grid md:grid-cols-2 gap-8 items-start">
          {/* Left: hero copy */}
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-900">
              Where Students &amp; Graduates{" "}
              <span className="text-emerald-600">Launch Careers</span>
            </h1>
            <p className="mt-4 text-gray-700 text-base md:text-lg">
              Connect with peers, land real opportunities, and grow your skills
              — all in one community built for you.
            </p>
          </div>

          {/* Right: auth card */}
          <div ref={formRef} className="bg-white rounded-xl shadow-md p-6">
            {/* ✅ Login tab on the LEFT, Sign Up on the RIGHT */}
            <div className="flex mb-5 border-b border-gray-200">
              <button
                onClick={() => setView(AuthView.Login)}
                className={`flex-1 py-3 text-center font-semibold ${
                  view === AuthView.Login
                    ? "border-b-4 border-blue-900 text-blue-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                type="button"
                aria-current={view === AuthView.Login}
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
                aria-current={view === AuthView.SignUp}
              >
                Sign Up
              </button>
            </div>

            {view === AuthView.SignUp && (
              <>
                <form onSubmit={handleSignUp} className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  </div>
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
                    className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded font-semibold"
                  >
                    Create my account
                  </button>
                </form>
                <div className="mt-4">
                  <div
                    id="googleSignUpDiv"
                    className="flex justify-center"
                  ></div>
                </div>
                <p className="mt-3 text-center text-xs text-gray-500">
                  By joining you agree to our Terms &amp; Privacy.
                </p>
              </>
            )}

            {view === AuthView.Login && (
              <>
                <form onSubmit={handleLogin} className="space-y-3">
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
                    className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded font-semibold"
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
                <div
                  id="googleSignInDiv"
                  className="mt-4 flex justify-center"
                ></div>
              </>
            )}

            {view === AuthView.ForgotPassword && (
              <form onSubmit={handleForgotPassword} className="space-y-3">
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
                  className="w-full bg-blue-900 hover:bg-blue-950 text-white py-3 rounded font-semibold"
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
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Global content error bar if needed */}
      {contentError && (
        <div className="bg-red-50 text-red-700 text-sm text-center py-2">
          {contentError}
        </div>
      )}

      {/* Jobs – 3 categories stacked vertically BEFORE articles */}
      <section id="jobs" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                Internships, entry-level &amp; hourly jobs
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Today&apos;s jobs on YPropel.
              </p>
            </div>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5"
            >
              Explore all jobs → sign up
            </button>
          </div>

          {loadingContent && (
            <p className="text-sm text-gray-500">Loading jobs…</p>
          )}

          {/* 3 vertical rows: internships, entry-level, hourly */}
          <div className="space-y-4">
            {/* Internships block – light green */}
            <div className="rounded-xl bg-emerald-50/80 p-4">
              <h3 className="text-sm font-semibold text-emerald-900 mb-3">
                Internships (preview)
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {internshipSample.slice(0, 3).map((job) => {
                  const title =
                    job.title || job.position_name || "Internship opportunity";
                  const company = job.company || "Company";
                  const locationParts = [
                    job.city,
                    job.state,
                    job.country,
                  ].filter(Boolean);
                  const location = locationParts.join(", ") || "Location";
                  const posted = formatDate(job.posted_at);

                  return (
                    <div
                      key={`intern-${job.id}`}
                      className="rounded-lg border border-emerald-100 bg-white p-3 flex flex-col"
                    >
                      <div className="text-xs font-semibold inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 self-start">
                        Internship
                      </div>
                      <div className="mt-2 text-sm font-semibold text-blue-900 line-clamp-2">
                        {title}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {company}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {location}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {posted ? `Posted ${posted}` : "Posted recently"}
                      </div>
                      <button
                        onClick={handleLockedClick}
                        className="mt-3 inline-flex items-center rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1 self-start"
                      >
                        Apply → sign up
                      </button>
                    </div>
                  );
                })}
                {internshipSample.length === 0 && !loadingContent && (
                  <p className="text-xs text-gray-500">
                    No internships listed yet. New roles will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Entry-level block – light blue */}
            <div className="rounded-xl bg-blue-50/80 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Entry-level roles (preview)
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {entryLevelSample.slice(0, 3).map((job) => {
                  const title =
                    job.title || job.position_name || "Entry-level role";
                  const company = job.company || "Company";
                  const locationParts = [
                    job.city,
                    job.state,
                    job.country,
                  ].filter(Boolean);
                  const location = locationParts.join(", ") || "Location";
                  const posted = formatDate(job.posted_at);

                  return (
                    <div
                      key={`entry-${job.id}`}
                      className="rounded-lg border border-blue-100 bg-white p-3 flex flex-col"
                    >
                      <div className="text-xs font-semibold inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 self-start">
                        Entry-level
                      </div>
                      <div className="mt-2 text-sm font-semibold text-blue-900 line-clamp-2">
                        {title}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {company}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {location}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {posted ? `Posted ${posted}` : "Posted recently"}
                      </div>
                      <button
                        onClick={handleLockedClick}
                        className="mt-3 inline-flex items-center rounded-full bg-blue-900 hover:bg-blue-950 text-white text-[11px] font-semibold px-3 py-1 self-start"
                      >
                        Apply → sign up
                      </button>
                    </div>
                  );
                })}
                {entryLevelSample.length === 0 && !loadingContent && (
                  <p className="text-xs text-gray-500">
                    No entry-level roles yet. New opportunities will appear
                    here.
                  </p>
                )}
              </div>
            </div>

            {/* Hourly block – light amber */}
            <div className="rounded-xl bg-amber-50/80 p-4">
              <h3 className="text-sm font-semibold text-amber-900 mb-3">
                Hourly &amp; part-time (preview)
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {hourlySample.slice(0, 3).map((job) => {
                  const title =
                    job.title ||
                    job.position_name ||
                    "Hourly / part-time job";
                  const company = job.company || "Company";
                  const locationParts = [
                    job.city,
                    job.state,
                    job.country,
                  ].filter(Boolean);
                  const location = locationParts.join(", ") || "Location";
                  const posted = formatDate(job.posted_at);

                  return (
                    <div
                      key={`hourly-${job.id}`}
                      className="rounded-lg border border-amber-100 bg-white p-3 flex flex-col"
                    >
                      <div className="text-xs font-semibold inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 self-start">
                        Hourly / Part-time
                      </div>
                      <div className="mt-2 text-sm font-semibold text-blue-900 line-clamp-2">
                        {title}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {company}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {location}
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {posted ? `Posted ${posted}` : "Posted recently"}
                      </div>
                      <button
                        onClick={handleLockedClick}
                        className="mt-3 inline-flex items-center rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-3 py-1 self-start"
                      >
                        Apply → sign up
                      </button>
                    </div>
                  );
                })}
                {hourlySample.length === 0 && !loadingContent && (
                  <p className="text-xs text-gray-500">
                    No hourly / part-time jobs yet. New roles will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Last added articles */}
      <section id="articles" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                Last added articles
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Fresh career tips, study advice, and early-career stories from
                inside YPropel.
              </p>
            </div>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold px-5 py-2.5"
            >
              Read all → sign up
            </button>
          </div>

          {loadingContent && (
            <p className="text-sm text-gray-500">Loading articles…</p>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {(articles || []).slice(0, 3).map((article) => (
              <div
                key={article.id}
                className="text-left rounded-xl border bg-gray-50 hover:border-emerald-500 hover:bg-white hover:shadow-sm transition flex flex-col overflow-hidden"
              >
                {article.cover_image && (
                  <div className="h-32 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600 line-clamp-3 flex-1">
                    {truncate(article.content, 130)}
                  </p>
                  <button
                    onClick={handleLockedClick}
                    className="mt-3 inline-flex items-center rounded-full bg-blue-900 hover:bg-blue-950 text-white text-[11px] font-semibold px-3 py-1 self-start"
                  >
                    Read article → sign up
                  </button>
                </div>
              </div>
            ))}
            {articles.length === 0 && !loadingContent && (
              <p className="text-xs text-gray-500">
                No articles published yet. New ones will appear here.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Last added job fairs */}
      <section id="job-fairs" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                Last added job fairs &amp; events
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                A sample of the events YPropel members track to meet employers
                and universities.
              </p>
            </div>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5"
            >
              View all events → sign up
            </button>
          </div>

          {loadingContent && (
            <p className="text-sm text-gray-500">Loading job fairs…</p>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {(jobFairs || []).slice(0, 3).map((fair) => {
              const name = fair.name || fair.title || "Job Fair / Event";
              const location = fair.location || "Online / TBD";
              const date = formatDate(fair.start_datetime);

              return (
                <div
                  key={fair.id}
                  className="text-left rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition p-4 flex flex-col"
                >
                  <h3 className="text-sm font-semibold text-blue-900 line-clamp-2">
                    {name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">{location}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {date || "Upcoming"}
                  </p>
                  <p className="mt-2 text-xs text-gray-600 line-clamp-3 flex-1">
                    {truncate(fair.description as string, 120) ||
                      "Create a free account to see full event details, schedule, and how to register."}
                  </p>
                  <button
                    onClick={handleLockedClick}
                    className="mt-3 inline-flex items-center rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1 self-start"
                  >
                    Register → sign up
                  </button>
                </div>
              );
            })}
            {jobFairs.length === 0 && !loadingContent && (
              <p className="text-xs text-gray-500">
                No job fairs listed yet. New events will appear here.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* "Inside YPropel you'll find..." BELOW the 3 new sections */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Inside YPropel you&apos;ll find:
          </h3>
          <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
            <li>Internships across tech, business, and non-profits</li>
            <li>Entry-level roles for new grads &amp; career switchers</li>
            <li>Hourly &amp; part-time jobs that fit student schedules</li>
          </ul>
        </div>
      </section>

      {/* Social Proof BELOW bullets */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 items-center text-center">
          <div className="text-sm text-gray-500">
            Trusted by{" "}
            <span className="font-semibold text-blue-900">2,000+</span> students
          </div>
          <div className="text-sm text-gray-500">Internships posted weekly</div>
          <div className="text-sm text-gray-500">
            Mentors &amp; peers worldwide
          </div>
          <div className="text-sm text-gray-500">Fast, supportive community</div>
        </div>
      </section>

      {/* -------- Existing below-the-fold sections -------- */}

      {/* High-level Features */}
      <section id="features" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            {
              icon: "👥",
              title: "Build Your Network",
              desc: "Connect with students, mentors, and young professionals.",
            },
            {
              icon: "🎯",
              title: "Find Opportunities",
              desc: "Internships, freelance gigs, and entry-level roles tailored to you.",
            },
            {
              icon: "📚",
              title: "Grow Your Skills",
              desc: "Career resources, mini-courses, and expert advice.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition"
            >
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
            <h2 className="text-3xl font-bold text-blue-900">
              Discussion Board &amp; Study Circles
            </h2>
            <p className="mt-3 text-gray-700">
              Collaborate with peers in focused groups. Ask questions, share
              notes, and keep each other accountable.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>Topic channels for courses, majors, interview prep</li>
              <li>Study Circles with goals, schedules, and progress tracking</li>
              <li>Moderated, supportive spaces — no noise, no spam</li>
            </ul>
            <button
              onClick={scrollToForm}
              className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
            >
              Join a Study Circle
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {studyCirclesDemo.map((c) => (
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
          <h2 className="text-3xl font-bold text-blue-900 text-center">
            Daily, Relevant &amp; Distraction-Free
          </h2>
          <p className="mt-2 text-center text-gray-700">
            Student-friendly summaries of news that impacts your studies,
            internships, and early career.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((n, idx) => (
              <article
                key={idx}
                className="p-6 bg-white border rounded-xl hover:shadow-md transition"
              >
                <span className="inline-block text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                  {n.tag}
                </span>
                <h3 className="mt-3 font-semibold text-blue-900">{n.title}</h3>
                <p className="mt-2 text-xs text-gray-500">{n.time}</p>
                <button
                  onClick={scrollToForm}
                  className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Get full access →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Hourly Jobs for HS Students */}
      <section id="jobs-hs" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold text-blue-900">
              Hourly Jobs for High-School Students
            </h2>
            <p className="mt-3 text-gray-700">
              Flexible, student-safe listings to help you earn experience (and
              money) while in school.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>Curated by relevance and safety</li>
              <li>Local &amp; remote options with evening/weekend shifts</li>
              <li>Simple applications + resume tips included</li>
            </ul>
            <button
              onClick={scrollToForm}
              className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
            >
              Browse Jobs &amp; Internships
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {hourlyJobsDemo.map((j) => (
              <div key={j.role} className="p-4 border rounded-xl bg-gray-50">
                <h3 className="font-semibold text-blue-900">{j.role}</h3>
                <p className="text-sm text-gray-600 mt-1">{j.pay}</p>
                <p className="text-sm text-gray-600">
                  {j.location} • {j.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PitchPoint Video Hub */}
      <section id="pitchpoint" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-blue-900">
              PitchPoint: Your Video Elevator Pitch
            </h2>
            <p className="mt-3 text-gray-700">
              Record a short video to showcase your skills, projects, and story —
              then share it with employers and universities.
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
          </div>
          <div className="aspect-square bg-white border rounded-xl overflow-hidden">
            <img
              src={PITCHPOINT_IMG}
              alt="PitchPoint preview"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Educational Videos (Distraction-Free) */}
      <section id="videos" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold text-blue-900">
              Educational Videos without the Noise
            </h2>
            <p className="mt-3 text-gray-700">
              We curate the best how-tos and lectures from around the web and
              present them in a focused player — no comments, no autoplay rabbit
              holes, just learning.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
              <li>Topic playlists: coding, design, AI, career prep</li>
              <li>Time-boxed modules with notes &amp; key takeaways</li>
              <li>Save to your queue; discuss in Study Circles</li>
            </ul>
            <button
              onClick={scrollToForm}
              className="mt-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
            >
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
          <h2 className="text-3xl font-bold text-blue-900 text-center">
            What Makes YPropel Different
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Built for Students",
                desc: "Everything targets your stage — not mid-career noise.",
              },
              {
                title: "Distraction-Free",
                desc: "Curated news & videos, clean viewing, zero spam.",
              },
              {
                title: "Action First",
                desc: "Study Circles, Internships & jobs, and PitchPoint to get results fast.",
              },
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
          <h2 className="text-2xl font-bold text-blue-900 text-center">
            What Members Say
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Sara, CS Student",
                quote:
                  "I landed my first paid internship through YPropel in 3 weeks.",
              },
              {
                name: "Leo, Grad",
                quote:
                  "Finally a platform that’s not overwhelming—super targeted for us.",
              },
              {
                name: "Amira, HS Senior",
                quote:
                  "The community helped me choose a major and build a starter portfolio.",
              },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl border bg-gray-50">
                <p className="text-gray-800 italic">“{t.quote}”</p>
                <p className="mt-3 text-sm font-semibold text-blue-900">
                  {t.name}
                </p>
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
              {
                q: "Is YPropel free?",
                a: "Yes. You can join free and upgrade later if you want more features.",
              },
              {
                q: "Who is YPropel for?",
                a: "High school & university students, recent grads, and early-career professionals.",
              },
              {
                q: "How long does sign-up take?",
                a: "Less than 60 seconds. Continue with Google for the fastest start.",
              },
              {
                q: "What are Study Circles?",
                a: "Small, goal-oriented groups with cadence, shared resources, and progress tracking.",
              },
              {
                q: "What is PitchPoint?",
                a: "A clean video hub to host your short pitch—share it with employers and universities.",
              },
              {
                q: "Do you list hourly jobs for HS students?",
                a: "Yes. Curated, student-safe roles with simple applications.",
              },
              {
                q: "How is YPropel different from other platforms?",
                a: "We remove distractions, target student needs only, and help you act: circles, jobs, pitch videos, and curated learning.",
              },
            ].map((item) => (
              <details key={item.q} className="p-5 group">
                <summary className="cursor-pointer font-semibold text-blue-900 flex justify-between items-center">
                  {item.q}{" "}
                  <span className="text-gray-400 group-open:rotate-180 transition">
                    ⌄
                  </span>
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
          <h2 className="text-3xl font-extrabold">
            Ready to launch your future?
          </h2>
          <p className="mt-2 text-blue-100">
            Join the student &amp; graduate community built to help you succeed.
          </p>
          <button
            onClick={scrollToForm}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-3 font-semibold"
          >
            Join YPropel Free
          </button>
        </div>
      </section>

      {/* Footer – simple & clean */}
      <footer className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-6 justify-between">
          <p>© {new Date().getFullYear()} YPropel. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="hover:text-blue-900" href="/terms">
              Terms
            </a>
            <a className="hover:text-blue-900" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-blue-900" href="/contact">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
