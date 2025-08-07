import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient";

const PaymentSuccess = () => {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const postJobAfterPayment = async () => {
      let jobData = null;
      let token = null;

      // Wait up to 3 seconds for sessionStorage/localStorage to be available
      for (let i = 0; i < 6; i++) {
        jobData = sessionStorage.getItem("pendingJobPost");
        token = localStorage.getItem("token");

        if (jobData && token) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!jobData || !token) {
        setStatus("error");
        return;
      }

      const parsed = JSON.parse(jobData);

      try {
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
          const companyId = localStorage.getItem("companyId");
            setStatus("success");
            if (companyId) {
            router.push(`/PostJob?companyId=${companyId}`);

            } else {
            router.push("/"); // fallback if companyId is not found
            }
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Error posting job after payment:", err);
        setStatus("error");
      }
    };

    postJobAfterPayment();
  }, [router]);

  return (
    <div className="p-10 text-center">
      {status === "loading" && (
        <>
          <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
          <p>Your job is being posted... Please wait.</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-red-600">Oops!</h1>
          <p>Something went wrong. Please try posting your job again.</p>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
