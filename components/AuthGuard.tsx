// components/AuthGuard.tsx
import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";

type Props = {
  children: ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // We are on client side now
  }, []);

  useEffect(() => {
    if (isClient) {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/main"); // Redirect to your login/signup page
      }
    }
  }, [isClient, router]);

  // Don't render children until we know we're on client and token exists
  if (!isClient) return null;
  if (!localStorage.getItem("token")) return null;

  return <>{children}</>;
}
