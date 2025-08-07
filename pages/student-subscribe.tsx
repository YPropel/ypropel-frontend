import React, { useState } from "react";

const StudentSubscribePage = () => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Make a POST request to the backend to create the Stripe session
      const response = await fetch("/payment/create-student-subscription-checkout-session", {
        method: "POST",
      });

      const session = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = session.url; // Redirect to Stripe checkout
    } catch (error) {
      console.error("Error creating Stripe session:", error);
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
