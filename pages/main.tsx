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
  const [view, setView] = useState<AuthView>(AuthView.SignUp); // default to Sign Up for conversion
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
    // prevent open redirects: only allow same-site relative paths
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

  // ---- Job grouping: internships, entry-level, hourly ----
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

      {/* Sticky Header – EXACTLY your previous header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* Logo row */}
          <div className="flex items-center gap-3">
            <img src="/ypropel-logo.png" alt="YPropel" className="h-9 w-9" />
            <span className="font-semibold text-blue-900">YPropel</span>
          </div>

          {/* Nav row */}
          <nav
            className="hidden md:flex flex-wrap gap-6 text-sm text-gray-700 mt-2"
            role="navigation"
            aria-label="Primary"
          >
            <a href="#jobs" className="hover:text-blue-900">
              Jobs
            </a>
            <a href="#articles" className="hover:text-blue-900">
              Articles
            </a>
            <a href="#job-fairs" className="hover:text-blue-900">
              Job Fairs
            </a>
          </nav>
        </div>
      </header>

      {/* Hero – your original hero/auth layout */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900">
              Where Students &amp; Graduates{" "}
              <span className="text-emerald-600">Launch Careers</span>
            </h1>
            <p className="mt-4 text-gray-700 text-lg">
              Connect with peers, land real opportunities, and grow your skills
              — all in one community built for you.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={scrollToForm}
                className="w-full sm:w-auto rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
              >
                Join Free in 60s
              </button>
              <button
                onClick={() => {
                  setView(AuthView.SignUp);
                  setTimeout(() => {
                    const el = document.getElementById("googleSignUpDiv");
                    el?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }, 0);
                }}
                className="w-full sm:w-auto rounded-lg border border-gray-300 hover:border-blue-900 text-blue-900 font-semibold px-6 py-3 bg-white"
              >
                Continue with Google
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              No spam. Cancel anytime.
            </p>
          </div>

          {/* Auth Card */}
          <div
            ref={formRef}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex mb-5 border-b border-gray-200">
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
                  By joining you agree to our Terms &amp; Privacy. No spam.
                  Cancel anytime.
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

      {/* Social Proof – keep your simple strip */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 items-center text-center">
          <div className="text-sm text-gray-500">
            Trusted by{" "}
            <span className="font-semibold text-blue-900">2,000+</span> students
          </div>
          <div className="text-sm text-gray-500">Internships posted weekly</div>
          <div className="text-sm text-gray-500">Mentors &amp; peers worldwide</div>
          <div className="text-sm text-gray-500">Fast, supportive community</div>
        </div>
      </section>

      {/* Internships / Entry-level / Hourly samples */}
      <section id="jobs" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                Internships, entry-level &amp; hourly jobs
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                A quick sample of the opportunities inside YPropel. Create a
                free account to unlock full details &amp; apply.
              </p>
            </div>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5"
            >
              Create free account to see all jobs
            </button>
          </div>

          {loadingContent && (
            <p className="text-sm text-gray-500">Loading jobs…</p>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {/* Internships */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-900">
                Internships (preview)
              </h3>
              {internshipSample.slice(0, 3).map((job) => {
                const title = job.title || job.position_name || "Internship";
                const company = job.company || "Company";
                const locationParts = [
                  job.city,
                  job.state,
                  job.country,
                ].filter(Boolean);
                const location = locationParts.join(", ") || "Location";
                const posted = formatDate(job.posted_at);

                return (
                  <button
                    key={`intern-${job.id}`}
                    onClick={handleLockedClick}
                    className="w-full text-left p-4 rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="text-sm font-semibold text-blue-900">
                      {title}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">{company}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {location}
                    </div>
                    <div className="mt-2 text-[11px] text-gray-400">
                      {posted
                        ? `Posted ${posted}.`
                        : "Posted recently."}{" "}
                      Create a free account to see full description &amp; apply.
                    </div>
                  </button>
                );
              })}
              {internshipSample.length === 0 && !loadingContent && (
                <p className="text-xs text-gray-500">
                  No internships available yet. New ones will appear here.
                </p>
              )}
            </div>

            {/* Entry Level */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-900">
                Entry-level roles (preview)
              </h3>
              {entryLevelSample.slice(0, 3).map((job) => {
                const title = job.title || job.position_name || "Entry-level";
                const company = job.company || "Company";
                const locationParts = [
                  job.city,
                  job.state,
                  job.country,
                ].filter(Boolean);
                const location = locationParts.join(", ") || "Location";
                const posted = formatDate(job.posted_at);

                return (
                  <button
                    key={`entry-${job.id}`}
                    onClick={handleLockedClick}
                    className="w-full text-left p-4 rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="text-sm font-semibold text-blue-900">
                      {title}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">{company}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {location}
                    </div>
                    <div className="mt-2 text-[11px] text-gray-400">
                      {posted
                        ? `Posted ${posted}.`
                        : "Posted recently."}{" "}
                      Create a free account to see full description &amp; apply.
                    </div>
                  </button>
                );
              })}
              {entryLevelSample.length === 0 && !loadingContent && (
                <p className="text-xs text-gray-500">
                  No entry-level roles available yet.
                </p>
              )}
            </div>

            {/* Hourly Jobs */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-900">
                Hourly &amp; part-time (preview)
              </h3>
              {hourlySample.slice(0, 3).map((job) => {
                const title =
                  job.title || job.position_name || "Hourly / part-time job";
                const company = job.company || "Company";
                const locationParts = [
                  job.city,
                  job.state,
                  job.country,
                ].filter(Boolean);
                const location = locationParts.join(", ") || "Location";
                const posted = formatDate(job.posted_at);

                return (
                  <button
                    key={`hourly-${job.id}`}
                    onClick={handleLockedClick}
                    className="w-full text-left p-4 rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="text-sm font-semibold text-blue-900">
                      {title}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">{company}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {location}
                    </div>
                    <div className="mt-2 text-[11px] text-gray-400">
                      {posted
                        ? `Posted ${posted}.`
                        : "Posted recently."}{" "}
                      Create a free account to see full description &amp; apply.
                    </div>
                  </button>
                );
              })}
              {hourlySample.length === 0 && !loadingContent && (
                <p className="text-xs text-gray-500">
                  No hourly / part-time jobs listed yet.
                </p>
              )}
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
              Create free account to read all
            </button>
          </div>

          {loadingContent && (
            <p className="text-sm text-gray-500">Loading articles…</p>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {(articles || []).slice(0, 3).map((article) => (
              <button
                key={article.id}
                onClick={handleLockedClick}
                className="text-left rounded-xl border bg-gray-50 hover:border-emerald-500 hover:bg-white hover:shadow-sm transition cursor-pointer flex flex-col overflow-hidden"
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
                  <div className="mt-3 text-[11px] text-gray-400">
                    Create a free account to read the full article and save it.
                  </div>
                </div>
              </button>
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
              Create free account to view all events
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
                <button
                  key={fair.id}
                  onClick={handleLockedClick}
                  className="text-left rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer p-4 flex flex-col"
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
                  <div className="mt-3 text-[11px] text-gray-400">
                    Sign up to save this event and get reminders.
                  </div>
                </button>
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

      {/* Footer – keep simple & clean */}
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
