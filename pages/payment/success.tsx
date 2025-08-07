import { useEffect } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient";

const PaymentSuccess = () => {
  const router = useRouter();

  useEffect(() => {
    const postJobAfterPayment = async () => {
      const jobData = sessionStorage.getItem("pendingJobPost");
      const token = localStorage.getItem("token");

      if (!jobData || !token) return;

      const parsed = JSON.parse(jobData);

      const response = await apiFetch("/companies/post-job", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      if (response.ok) {
        sessionStorage.removeItem("pendingJobPost");
        router.push("/company/jobs"); // or wherever you want to redirect after posting
      } else {
        console.error("Failed to post job after payment");
      }
    };

    postJobAfterPayment();
  }, [router]);

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
      <p>Your job is being posted...</p>
    </div>
  );
};

export default PaymentSuccess;
