import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiFetch } from "../../apiClient";

export default function SubscribeConfirmation() {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session_id) return;
    async function verify() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const res = await apiFetch(`/subscriptions/verify-session?session_id=${session_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to verify session");
    const data = await res.json();
    setSuccess(data.status === "complete");
  } catch (err: any) {
    setError(err.message || "Unknown error");
  } finally {
    setLoading(false);
  }
}

    verify();
  }, [session_id]);

  if (loading) return <p>Verifying payment...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (success) return <p>Subscription successful! Thank you.</p>;

  return <p>Subscription not completed.</p>;
}
