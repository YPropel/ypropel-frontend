import { useEffect } from "react";
import { useRouter } from "next/router";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { token } = router.query;
    if (typeof token === "string") {
      localStorage.setItem("token", token);

      // Optionally, fetch user profile here with token and store user info in localStorage or state

      router.replace("/"); // redirect to home
    } else {
      alert("OAuth login failed: No token received");
      router.replace("/login"); // or wherever your login page is
    }
  }, [router.isReady, router.query, router]);

  return <div>Logging you in...</div>;
}
