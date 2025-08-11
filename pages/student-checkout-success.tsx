import React, { useEffect, useState } from "react";
import { apiFetch } from "../apiClient"; // Your API client

export default function StudentCheckoutSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get the session_id from URL query params once on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session_id = urlParams.get("session_id");
    setSessionId(session_id);
  }, []);

  // Get token from localStorage
  const token = localStorage.getItem("token");

  // Confirm payment function
  const confirmPayment = async () => {
    if (!sessionId) {
      setError("No session ID found");
      return;
    }
    if (!token) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/payment/confirm-student-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        setIsPremium(true);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update premium status");
      }
    } catch (err) {
      setError("There was an error confirming payment");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Processing your payment...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2>Payment Successful!</h2>
      {isPremium ? (
        <p>You are now a premium member. Enjoy the courses!</p>
      ) : (
        <>
          <p>Click below to confirm your premium status:</p>
          <button
            onClick={confirmPayment}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Confirm Premium Status
          </button>
        </>
      )}
    </div>
  );
}
