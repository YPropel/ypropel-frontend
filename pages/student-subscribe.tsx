import React from "react";

export default function TestPayment() {
  const token = "YOUR_VALID_JWT_TOKEN_HERE"; // Replace with your actual token

  const testCreateCheckout = async () => {
    try {
      const res = await fetch("https://ypropel-backend.onrender.com/payment/create-student-subscription-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ planType: "student_monthly" })
      });

      const data = await res.json();
      console.log("✅ create-student-subscription-checkout-session response:", data);
    } catch (err) {
      console.error("❌ Error hitting create checkout route:", err);
    }
  };

  const testConfirmPayment = async () => {
    try {
      const res = await fetch("https://ypropel-backend.onrender.com/payment/confirm-student-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ paymentId: "test_123", status: "success" })
      });

      const data = await res.json();
      console.log("✅ confirm-student-payment response:", data);
    } catch (err) {
      console.error("❌ Error hitting confirm payment route:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Payment Routes</h1>
      <button onClick={testCreateCheckout}>Test Create Checkout Session</button>
      <br /><br />
      <button onClick={testConfirmPayment}>Test Confirm Payment</button>
    </div>
  );
}
