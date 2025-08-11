import React, { useState } from "react";
import { apiFetch } from "../apiClient";

export default function StudentSubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/subscriptions/create-checkout-session", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const data = await res.json();
      window.location.href = data.url; // redirect to Stripe checkout
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Subscribe to Mini Courses</h1>
      <p>Get unlimited access for just <strong>$4.99/month</strong>.</p>
      {error && <p className="text-red-600">{error}</p>}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Subscribe"}
      </button>
    </div>
  );
}
