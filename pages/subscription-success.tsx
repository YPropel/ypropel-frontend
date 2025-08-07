import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const SubscriptionSuccess = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clearPendingData = () => {
      // Clear any pending subscription/session storage
      sessionStorage.removeItem("pendingJobPost");
      setLoading(false);
    };

    clearPendingData();
  }, []);

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
