import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";

type Props = {
  children: ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we are running client-side
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const token = window.localStorage.getItem("token");
      if (!token) {
        router.replace("/main"); // Redirect to login/signup page
      }
    }
  }, [isClient, router]);

  if (!isClient) {
    // Don't render children until on client side (localStorage is accessible)
    return null;
  }

  return <>{children}</>;
}
