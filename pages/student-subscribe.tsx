import React, { useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient"; // Ensure the correct import path for apiFetch

const StudentSubscribePage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      // Make a POST request to create the Stripe session
      const response = await apiFetch("/payment/create-student-subscription-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Include the token in the Authorization header
        },
      });

      // Check for successful response
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          console.error("Stripe URL not returned in response");
        }
      } else {
        // Handle any backend errors
        const errorData = await response.json();
        console.error("Error from backend:", errorData.error);
      }
    } catch (error) {
      console.error("Subscription failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Subscribe to Mini-Courses</h1>
      <p className="mb-6">
        Access premium mini-courses for $4.99 per month. Upgrade your account to enjoy all of our premium content.
      </p>

      <button
        onClick={handleSubscribe}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Redirecting to Stripe..." : "Subscribe Now"}
      </button>
    </div>
  );
};

export default StudentSubscribePage;
