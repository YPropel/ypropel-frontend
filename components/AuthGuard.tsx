// components/AuthGuard.tsx
import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";

type Props = {
  children: ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/main"); // Redirect to your login/signup page
    }
  }, [router]);

  // While checking token or if no token, don’t render children
  if (typeof window !== "undefined" && !localStorage.getItem("token")) {
    return null; // or a spinner/loading indicator if you prefer
  }

  return <>{children}</>;
}
