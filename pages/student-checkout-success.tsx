import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient";

export default function SubscribeConfirmationPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!session_id) return;

    async function verifySession() {
      try {
        const res = await apiFetch(`/subscriptions/verify-session?session_id=${session_id}`);
        if (!res.ok) throw new Error("Failed to verify session");
        const data = await res.json();
        if (data.status === "complete") {
          setSuccess(true);
        } else {
          setError("Subscription not completed.");
        }
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [session_id]);

  if (loading) return <p>Verifying subscription...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      {success ? (
        <>
          <h1 className="text-3xl font-bold mb-4">Subscription Successful!</h1>
          <p>Thank you for subscribing. You now have full access to the mini courses.</p>
        </>
      ) : (
        <p>Subscription not complete.</p>
      )}
    </div>
  );
}
