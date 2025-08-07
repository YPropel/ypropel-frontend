import { useEffect } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient";

export default function CheckoutRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirectToStripe = async () => {
      const token = localStorage.getItem("token");
      const pendingJob = sessionStorage.getItem("pendingJobPost");

      if (!token || !pendingJob) {
        router.push("/post-job");
        return;
      }

      const response = await apiFetch("/payment/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ jobData: JSON.parse(pendingJob) }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong while redirecting to payment.");
        router.push("/post-job");
      }
    };

    redirectToStripe();
  }, [router]);

  return <p>Redirecting to Stripe Checkout...</p>;
}
