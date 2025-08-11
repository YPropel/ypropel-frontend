import React from "react";
import { apiFetch } from "../apiClient";

export default function TestCreateSubscriptionCheckoutSession() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleCreateSession = async () => {
    if (!token) {
      alert("No auth token found. Please login.");
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
      console.log("Create checkout session response:", data);

      if (data.url) {
        // Redirect user to Stripe checkout page
        window.location.href = data.url;
      } else {
        alert("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("Error creating checkout session");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Test Create Subscription Checkout Session</h1>
      <button onClick={handleCreateSession}>Create Checkout Session</button>
    </div>
  );
}
