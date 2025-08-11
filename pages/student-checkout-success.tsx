// pages/payment/confirm-student-payment.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient"; // adjust path if needed

export default function ConfirmStudentPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const sessionId = sessionStorage.getItem("student_payment_session_id");
        if (!sessionId) {
          setStatus("No payment session found.");
          setLoading(false);
          return;
        }

        const res = await apiFetch("/payment/confirm-student-payment", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });

        if (res.success) {
          setStatus("✅ Student payment confirmed! Subscription active.");
          // You can redirect to student dashboard if you want:
          // router.push("/student/dashboard");
        } else {
          setStatus("❌ Payment confirmation failed: " + res.error);
        }
      } catch (err) {
        console.error(err);
        setStatus("❌ Error confirming payment.");
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [router]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Confirming Student Payment...</h2>
      {loading ? <p>Please wait...</p> : <p>{status}</p>}
    </div>
  );
}
