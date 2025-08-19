import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";

type Props = { children: ReactNode };

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true); // avoid flicker while we decide

  useEffect(() => {
    // Run only on client (localStorage/sessionStorage)
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("token");

    // If logged in → allow render
    if (token) {
      setChecking(false);
      return;
    }

    // Not logged in → if we're already on the auth page, just render it (no loop)
    const onAuthPage = router.pathname.startsWith("/main");
    if (onAuthPage) {
      setChecking(false);
      return;
    }

    // Remember where the user was going (e.g., /jobs/123)
    const returnTo = router.asPath || "/";
    try {
      window.sessionStorage.setItem("returnTo", returnTo);
    } catch {}

    // Send to auth page, default to Sign Up, and include `redirect` param
    const redirect = encodeURIComponent(returnTo);
    router.replace(`/main?view=signup&redirect=${redirect}`);
    // keep `checking` true until route changes away
  }, [router]);

  if (checking) {
    // Minimal placeholder while we check/redirect
    return <div className="min-h-screen grid place-items-center text-gray-500">Checking membership…</div>;
  }

  return <>{children}</>;
}
