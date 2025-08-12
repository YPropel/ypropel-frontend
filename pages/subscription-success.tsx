//---Page: where companies can post jobs after being subscribed to monthly package
//------------------------------------------------------
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient";

const SubscriptionSuccess = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("User not logged in.");
          setLoading(false);
          return;
        }

        const response = await apiFetch("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setError("Failed to verify subscription.");
          setLoading(false);
          return;
        }

        const userData = await response.json();

        if (!userData.is_company_premium) {
          setError("Subscription not active. Please subscribe first.");
          setLoading(false);
          return;
        }

        // Clear pending session data after confirmation
        sessionStorage.removeItem("pendingJobPost");
        setLoading(false);
      } catch {
        setError("An error occurred. Please try again.");
        setLoading(false);
      }
    };

    verifySubscription();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Oops!</h1>
        <p className="mb-6">{error}</p>
        <button
          onClick={() => router.push("/subscription")}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Subscribe Now
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Subscription Successful!</h1>
      <p className="text-lg mb-6">
        Thank you for subscribing to the YPropel Monthly Plan. You can now post unlimited jobs.
      </p>
      <button
        onClick={() => router.push("/PostJob")}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Post a Job Now
      </button>
    </div>
  );
};

export default SubscriptionSuccess;
