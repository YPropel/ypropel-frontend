import { apiFetch } from "../apiClient";


const handleSubscribe = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found. Please log in.");
    return;
  }

  try {
    const response = await apiFetch("/payment/create-subscription-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Stripe session creation failed:", errData.error || "Unknown error");
      return;
    }

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Stripe session URL not returned");
    }
  } catch (error) {
    console.error("Subscription failed:", error);
  }
};
