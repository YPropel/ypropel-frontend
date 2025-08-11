import React from "react";
import { apiFetch } from "../apiClient";
import { useRouter } from "next/router";

export default function TestPaymentAndRedirect() {
  const router = useRouter();
  const token = "YOUR_VALID_JWT_TOKEN_HERE"; // Replace with your actual token

  const runTestsAndRedirect = async () => {
    try {
      // Test create checkout session
      const resCreate = await apiFetch("/payment/create-student-subscription-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType: "student_monthly" }),
      });
      if (!resCreate.ok) throw new Error("Create checkout test failed");
      const dataCreate = await resCreate.json();
      console.log("Create checkout test response:", dataCreate);

      // Test confirm payment
      const resConfirm = await apiFetch("/payment/confirm-student-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: "test123" }),
      });
      if (!resConfirm.ok) throw new Error("Confirm payment test failed");
      const dataConfirm = await resConfirm.json();
      console.log("Confirm payment test response:", dataConfirm);

      // If both tests pass, redirect to success page with session_id
      router.push("/student-checkout-success?session_id=test123");
    } catch (err) {
      console.error("Test routes failed:", err);
      alert("Test routes failed. Check console.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Payment Routes and Redirect</h1>
      <button onClick={runTestsAndRedirect} className="bg-blue-600 text-white px-6 py-2 rounded">
        Run Tests and Go to Success Page
      </button>
    </div>
  );
}
