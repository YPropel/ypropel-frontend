// pages/admin/email-broadcast.tsx

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient";

interface BroadcastResult {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
}

export default function AdminEmailBroadcastPage() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin using localStorage role
  useEffect(() => {
    if (typeof window === "undefined") return;

    const role = localStorage.getItem("role");
    if (role === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setResult(null);

  if (!subject.trim() || !htmlBody.trim()) {
    setError("Subject and message body are required.");
    return;
  }

  if (typeof window === "undefined") {
    setError("This action must be performed in the browser.");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    setError("You must be logged in as an admin to send emails. Please log in again.");
    return;
  }

  try {
    setIsSending(true);

    const res = await apiFetch("/admin/email/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subject, htmlBody }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to send broadcast email.");
    }

    const data = await res.json();
    setResult(data);
  } catch (err: any) {
    setError(err.message || "Unexpected error while sending broadcast.");
  } finally {
    setIsSending(false);
  }
};

//------
  if (isAdmin === null) {
    // still checking role
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600">Access denied</h1>
          <p className="mt-2 text-gray-600">
            This page is for admins only. If you think this is a mistake, please log in with an admin account.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-semibold hover:bg-blue-950"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/ypropel-logo.png" alt="YPropel" className="h-8 w-8" />
            <span className="font-semibold text-blue-900">YPropel Admin</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 hover:text-blue-900"
          >
            Back to site
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-900">Send Broadcast Email</h1>
        <p className="mt-1 text-sm text-gray-600">
          This will email all users who have marketing emails enabled. An unsubscribe link will be added automatically.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. New internships and entry-level roles this week"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (HTML allowed)
            </label>
            <textarea
              className="w-full min-h-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              placeholder={`Example:\n<p>Hi there,</p>\n<p>We just added new internships and hourly jobs on YPropel. Log in to browse them.</p>`}
            />
            <p className="mt-1 text-xs text-gray-500">
              You can use basic HTML tags (&lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, etc.).  
              An unsubscribe link is automatically appended.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {result && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Email broadcast completed. Sent: <strong>{result.sent}</strong>, Failed:{" "}
              <strong>{result.failed}</strong>, Total considered: <strong>{result.total}</strong>.
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              ⚠️ Please double-check your text before sending. This will go to real members.
            </p>
            <button
              type="submit"
              disabled={isSending}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                isSending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-900 hover:bg-blue-950"
              }`}
            >
              {isSending ? "Sending…" : "Send broadcast"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
