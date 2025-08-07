import { apiFetch } from "../apiClient";


const handleSubscribe = async () => {
  try {
    const response = await apiFetch("/payment/create-subscription-session", {
      method: "POST",
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Stripe URL not returned");
    }
  } catch (error) {
    console.error("Subscription failed:", error);
  }
};