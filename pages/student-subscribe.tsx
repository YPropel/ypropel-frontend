import React from "react";
import { apiFetch } from "../apiClient";

export default function StartSubscriptionCheckout() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleStartCheckout = async () => {
    if (!token) {
      alert("Please log in first.");
      return;
    }

    try {
      const res = await apiFetch("/payment/create-student-subscription-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout page
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Error creating checkout session");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Subscribe to Premium Mini-Courses</h1>
      <button onClick={handleStartCheckout} className="bg-blue-600 text-white px-6 py-2 rounded">
        Start Subscription Checkout
      </button>
    </div>
  );
}
