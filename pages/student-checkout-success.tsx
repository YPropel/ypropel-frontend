import React, { useEffect, useState } from "react";
import { apiFetch } from "../apiClient"; // Your API client

export default function StudentCheckoutSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);  // Store session ID from query string
  const [isPremium, setIsPremium] = useState<boolean>(false); // Store user's premium status
  const [loading, setLoading] = useState<boolean>(true); // Track loading state
  const [error, setError] = useState<string | null>(null); // Store error message if any

  // Get the session_id from the query string
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session_id = urlParams.get("session_id");
    console.log("Session ID from URL:", session_id); 
    setSessionId(session_id);
  }, []);

  // Call the backend to confirm payment and update premium status
  const confirmPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Send session_id to backend to confirm payment and update user status
      console.log("Backend URL from environment variable:", process.env.REACT_APP_BACKEND_URL);
console.log("Frontend URL from environment variable:", process.env.REACT_APP_FRONTEND_URL);

      const fullUrl = `${process.env.REACT_APP_BACKEND_URL}/payment/confirm-payment`;  // Construct the full URL
      console.log("Sending request to:", fullUrl);  // Log the full URL

      const response = await apiFetch(fullUrl, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
        headers: { "Content-Type": "application/json" },  // Ensure correct headers
});
      if (response.ok) {
        setIsPremium(true); // Set user as premium after confirmation
      } else {
        setError("Failed to update premium status");
      }
    } catch (err) {
      setError("There was an error confirming payment");
    } finally {
      setLoading(false);
    }
  };

 // if (loading) return <p>Processing your payment...</p>; // Show loading message while confirming payment
  if (error) return <p className="text-red-600">{error}</p>; // Show error message if there was any issue

  return (
    <div>
      <h2>Payment Successful!</h2>
      {isPremium ? (
        <p>You are now a premium member. Enjoy the courses!</p>  // If user is successfully upgraded
      ) : (
        <>
          <p>Click below to confirm your premium status:</p>
          <button onClick={confirmPayment} className="bg-blue-600 text-white px-6 py-2 rounded">
            Confirm Premium Status
          </button>
        </>
      )}
    </div>
  );
}
