// pages/subscription.tsx
import { useEffect } from "react";

const Subscribe = () => {
  const handleSubscribe = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login first.");

    const response = await fetch("https://ypropel-backend.onrender.com/payment/create-subscription-checkout-session", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url; // Redirect to Stripe
    } else {
      alert("Error creating subscription session.");
    }
  };

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold">YPropel Monthly Subscription</h1>
      <p className="my-4">Unlimited job posts, branding, priority matching & more for $300/month.</p>
      <button
        onClick={handleSubscribe}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Subscribe for $300/month
      </button>
    </div>
  );
};

export default Subscribe;
