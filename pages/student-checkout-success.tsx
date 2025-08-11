import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient"; // adjust path
import Cookies from "js-cookie";

export default function StudentCheckoutSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState("Verifying payment...");

  useEffect(() => {
    if (!session_id) return; // Wait until session_id is available from query
    const token = Cookies.get("token"); // JWT stored in cookies

    const confirmPayment = async () => {
      try {
        const response = await apiFetch("/payment/confirm-student-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ session_id }),
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(`Payment confirmed! ${data.message || ""}`);
        } else {
          const errorData = await response.json();
          setStatus(`Payment failed: ${errorData.error || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error confirming payment:", error);
        setStatus("Error confirming payment. Please contact support.");
      }
    };

    confirmPayment();
  }, [session_id]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Student Subscription Payment</h1>
      <p>{status}</p>
    </div>
  );
}
