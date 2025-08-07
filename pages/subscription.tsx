import React from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient"; // ✅ Adjust if path is different

const SubscriptionPage = () => {
  const router = useRouter();

  const handleSubscribe = async () => {
    try {
      const response = await apiFetch("/payment/create-subscription-checkout-session", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Stripe URL not returned");
      }
    } catch (error) {
      console.error("Subscription failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-6">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-xl p-10">
        {/* Left Column: Content */}
        <div>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            Supercharge Your Hiring
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Unlock unlimited featured job and internship posts. Attract top student talent, boost your visibility, and brand your company in the student network.
          </p>

          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Unlimited job & internship postings</li>
            <li>Featured visibility for 30 days</li>
            <li>Priority candidate matching</li>
            <li>Newsletter spotlight</li>
            <li>Branded company profile</li>
            <li>Cancel anytime</li>
          </ul>

          <div className="text-2xl font-bold text-green-600 mb-4">
            $300 / month
          </div>

          <button
            onClick={handleSubscribe}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition"
          >
            Subscribe Now
          </button>

          <p className="text-xs text-gray-400 mt-2">Secured by Stripe. Cancel anytime.</p>
        </div>

        {/* Right Column: Visual */}
        <div className="flex items-center justify-center">
          <img
            src="/images/featured-job-illustration.png"
            alt="Featured Job Listing Illustration"
            className="w-full h-auto rounded-xl shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

// ✅ This export is required for the page to build
export default SubscriptionPage;
