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

// ------------ Types based on your routes ------------- //
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

interface MiniCourse {
  id: number;
  title?: string;
  category?: string;
  level?: string;
  duration_minutes?: number;
  short_description?: string;
  description?: string;
  [key: string]: any;
}

type ExploreTab = "jobs" | "articles" | "jobFairs" | "miniCourses";

export default function LandingPage() {
  const [view, setView] = useState<AuthView>(AuthView.SignUp); // default to Sign Up
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

  // content state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [jobFairs, setJobFairs] = useState<JobFair[]>([]);
  const [miniCourses, setMiniCourses] = useState<MiniCourse[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [exploreTab, setExploreTab] = useState<ExploreTab>("jobs");

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

  // Experience levels
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
        const [jobsRes, articlesRes, fairsRes, coursesRes] = await Promise.all([
          apiFetch("/jobs"),
          apiFetch("/articles"),
          apiFetch("/job-fairs"),
          apiFetch("/mini-courses"),
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

        if (coursesRes.ok) {
          const coursesJson = await coursesRes.json();
          setMiniCourses(coursesJson || []);
        } else {
          console.error("Failed to fetch mini courses");
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
    if (view === AuthView.Login) {
      setLoginData((p) => ({ ...p, [name]: value }));
    } else if (view === AuthView.SignUp) {
      setSignUpData((p) => ({ ...p, [name]: value }));
    } else {
      setForgotEmail(value);
    }
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
      if (view === AuthView.Login && loginDiv) {
        window.google.accounts.id.renderButton(loginDiv, opts);
      }
      if (view === AuthView.SignUp && signUpDiv) {
        window.google.accounts.id.renderButton(signUpDiv, opts);
      }
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

  // When user clicks any locked preview card
  const handleLockedClick = () => {
    setView(AuthView.SignUp);
    scrollToForm();
  };

  // format helpers
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

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* Logo row */}
          <div className="flex items-center gap-3">
            <img src="/ypropel-logo.png" alt="YPropel" className="h-9 w-9" />
            <span className="font-semibold text-blue-900">YPropel</span>
          </div>

          {/* Nav row (now below the logo) */}
          <nav
            className="hidden md:flex flex-wrap gap-6 text-sm text-gray-700 mt-2"
            role="navigation"
            aria-label="Primary"
          >
            <a href="#explore" className="hover:text-blue-900">
              Explore
            </a>
            <a href="#pitchpoint" className="hover:text-blue-900">
              PitchPoint
            </a>
            <a href="#videos" className="hover:text-blue-900">
              Videos
            </a>
            <a href="#why" className="hover:text-blue-900">
              Why Us
            </a>
            <a href="#faq" className="hover:text-blue-900">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900">
              Where Students &amp; Graduates{" "}
              <span className="text-emerald-600">Launch Careers</span>
            </h1>
            <p className="mt-4 text-gray-700 text-lg">
              Discover real internships, articles, job fairs, and mini-courses
              curated for you. Create a free account to unlock full access.
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
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
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

      {/* Social Proof */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 items-center text-center">
          <div className="text-sm text-gray-500">
            Trusted by{" "}
            <span className="font-semibold text-blue-900">2,000+</span>{" "}
            students
          </div>
          <div className="text-sm text-gray-500">Internships posted weekly</div>
          <div className="text-sm text-gray-500">Mentors &amp; peers worldwide</div>
          <div className="text-sm text-gray-500">Fast, supportive community</div>
        </div>
      </section>

      {/* Explore YPropel: Live previews + Create account */}
      <section id="explore" className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              See what&apos;s inside YPropel
            </h2>
            <p className="mt-2 text-sm md:text-base text-gray-700">
              Live previews of jobs, articles, job fairs, and mini-courses.{" "}
              <span className="font-semibold">
                Create a free account to unlock full details.
              </span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
            {[
              { id: "jobs", label: "Jobs & Internships" },
              { id: "articles", label: "Articles" },
              { id: "jobFairs", label: "Job Fairs" },
              { id: "miniCourses", label: "Mini-Courses (Premium)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setExploreTab(tab.id as ExploreTab)}
                className={`px-4 py-2 rounded-full border text-sm ${
                  exploreTab === tab.id
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile: stacked, Desktop: 2 columns (content + create account) */}
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {/* Left: preview content (2/3 on desktop) */}
            <div className="md:col-span-2 space-y-4">
              {loadingContent && (
                <div className="text-sm text-gray-500">Loading content…</div>
              )}
              {contentError && (
                <div className="text-sm text-red-500">{contentError}</div>
              )}

              {/* Jobs & Internships */}
              {exploreTab === "jobs" && !loadingContent && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-blue-900">
                      Featured Jobs &amp; Internships (preview)
                    </h3>
                    <button
                      onClick={handleLockedClick}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Unlock all →
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(jobs || []).slice(0, 4).map((job) => {
                      const title = job.title || job.position_name || "Job";
                      const company = job.company || "Company";
                      const locationParts = [
                        job.city,
                        job.state,
                        job.country,
                      ].filter(Boolean);
                      const location =
                        locationParts.join(", ") || "Location";
                      const posted = formatDate(job.posted_at);

                      return (
                        <button
                          key={job.id}
                          onClick={handleLockedClick}
                          className="w-full text-left p-4 rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer"
                        >
                          <div className="text-sm font-semibold text-blue-900">
                            {title}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {company}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {location}
                          </div>
                          {job.job_type && (
                            <div className="mt-1 inline-block text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                              {job.job_type}
                            </div>
                          )}
                          <div className="mt-2 text-[11px] text-gray-400">
                            {posted
                              ? `Posted ${posted}.`
                              : "Posted recently."}{" "}
                            Create a free account to see full description &amp;
                            apply.
                          </div>
                        </button>
                      );
                    })}
                    {jobs.length === 0 && !loadingContent && (
                      <p className="text-sm text-gray-500">
                        No jobs available yet. Check back soon!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Articles */}
              {exploreTab === "articles" && !loadingContent && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-blue-900">
                      Career articles &amp; resources (preview)
                    </h3>
                    <button
                      onClick={handleLockedClick}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Read more →
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(articles || []).slice(0, 6).map((article) => (
                      <button
                        key={article.id}
                        onClick={handleLockedClick}
                        className="w-full text-left p-4 rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer flex flex-col"
                      >
                        {article.cover_image && (
                          <div className="mb-2 h-24 w-full rounded-md overflow-hidden bg-gray-100">
                            <img
                              src={article.cover_image}
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h4 className="text-sm font-semibold text-blue-900 line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="mt-2 text-xs text-gray-600 line-clamp-3 flex-1">
                          {truncate(article.content, 120)}
                        </p>
                        <div className="mt-2 text-[11px] text-gray-400">
                          Create a free account to read the full article and
                          save it.
                        </div>
                      </button>
                    ))}
                    {articles.length === 0 && !loadingContent && (
                      <p className="text-sm text-gray-500">
                        No articles published yet. Check back soon!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Job Fairs */}
              {exploreTab === "jobFairs" && !loadingContent && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-blue-900">
                      Job Fairs &amp; Events (preview)
                    </h3>
                    <button
                      onClick={handleLockedClick}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View details →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(jobFairs || []).slice(0, 4).map((fair) => {
                      const name =
                        fair.name || fair.title || "Job Fair / Event";
                      const date = formatDate(fair.start_datetime);
                      const location =
                        fair.location || "Online / Location TBA";

                      return (
                        <button
                          key={fair.id}
                          onClick={handleLockedClick}
                          className="w-full text-left p-4 rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer"
                        >
                          <div className="text-sm font-semibold text-blue-900">
                            {name}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {location}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {date || "Upcoming"}
                          </div>
                          <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                            {truncate(
                              fair.description as string,
                              140
                            ) ||
                              "Create a free account to see full event details, schedule, and how to register."}
                          </p>
                          <div className="mt-2 text-[11px] text-gray-400">
                            Sign up to save this event and get reminders.
                          </div>
                        </button>
                      );
                    })}
                    {jobFairs.length === 0 && !loadingContent && (
                      <p className="text-sm text-gray-500">
                        No job fairs listed yet. New events will appear here.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Mini Courses */}
              {exploreTab === "miniCourses" && !loadingContent && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-blue-900">
                      Mini-courses (premium preview)
                    </h3>
                    <button
                      onClick={handleLockedClick}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Unlock courses →
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(miniCourses || []).slice(0, 4).map((course) => (
                      <button
                        key={course.id}
                        onClick={handleLockedClick}
                        className="w-full text-left p-4 rounded-xl border bg-white hover:border-emerald-500 hover:shadow-sm transition cursor-pointer"
                      >
                        <h4 className="text-sm font-semibold text-blue-900 line-clamp-2">
                          {course.title || "Mini-course"}
                        </h4>
                        <div className="mt-1 text-xs text-gray-600">
                          {course.category && (
                            <span>{course.category}</span>
                          )}
                          {course.level && (
                            <span className="ml-1 text-gray-500">
                              • {course.level}
                            </span>
                          )}
                        </div>
                        {course.duration_minutes && (
                          <div className="mt-1 text-xs text-gray-500">
                            ~{course.duration_minutes} min
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-600 line-clamp-3">
                          {truncate(
                            (course.short_description ||
                              course.description) as string,
                            140
                          )}
                        </p>
                        <div className="mt-2 text-[11px] text-gray-400">
                          Create a free account to see the full course and track
                          your progress.
                        </div>
                      </button>
                    ))}
                    {miniCourses.length === 0 && !loadingContent && (
                      <p className="text-sm text-gray-500">
                        Mini-courses are coming soon.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Create account panel (always visible) */}
            <aside className="flex flex-col justify-between rounded-2xl bg-blue-900 text-white p-5">
              <div>
                <h3 className="text-lg font-semibold">
                  Create your free YPropel account
                </h3>
                <p className="mt-2 text-sm text-blue-100">
                  Unlock full job details, save opportunities, join Study
                  Circles, and access distraction-free videos &amp; resources.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-blue-100">
                  <li>• See complete job &amp; internship descriptions</li>
                  <li>• Read full articles &amp; career guides</li>
                  <li>• Discover job fairs &amp; events that fit you</li>
                  <li>• Try premium mini-courses and PitchPoint</li>
                </ul>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={scrollToForm}
                  className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-blue-950 font-semibold py-2.5 text-sm"
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
                  className="w-full rounded-lg bg-white/10 border border-white/40 hover:bg-white/20 text-sm font-semibold"
                >
                  Continue with Google
                </button>
                <p className="mt-1 text-[11px] text-blue-100">
                  No spam. Cancel anytime.
                </p>
              </div>
            </aside>
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
              Record a short video to showcase your skills, projects, and story
              — then share it with employers and universities.
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
                desc: "Study Circles, jobs, job fairs, and PitchPoint to get results fast.",
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

      {/* FAQ */}
      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-2xl font-bold text-blue-900 text-center">FAQ</h2>
          <div className="mt-6 divide-y divide-gray-200 border rounded-xl bg-gray-50">
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
                q: "What can I access with a free account?",
                a: "You can browse jobs & internships, read articles, see job fairs, and start using PitchPoint and Study Circles.",
              },
              {
                q: "What are mini-courses?",
                a: "Short, focused lessons on topics like tech, careers, and productivity. Some are included in premium plans.",
              },
              {
                q: "How is YPropel different from other platforms?",
                a: "We remove distractions, target student needs only, and help you act quickly: jobs, job fairs, pitch videos, curated learning, and community.",
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
