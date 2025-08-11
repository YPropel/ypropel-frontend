import React, { useEffect, useState } from "react";
import { apiFetch } from "../apiClient";

export default function StudentCheckoutSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("session_id");
      setSessionId(id);
    }
  }, []);

  useEffect(() => {
    // Auto-confirm payment when sessionId is set
    if (sessionId && token) {
      confirmPayment();
    }
  }, [sessionId, token]);

  const confirmPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/payment/confirm-student-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        setIsPremium(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to confirm payment");
      }
    } catch (err) {
      setError("Error confirming payment");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Processing payment confirmation...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Payment Confirmation</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isPremium ? (
        <p>🎉 You are now a premium member! Enjoy your mini-courses.</p>
      ) : (
        !error && <p>Confirming your payment, please wait...</p>
      )}
    </div>
  );
}
