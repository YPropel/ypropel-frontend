import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";

type Props = {
  children: ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/main"); // Redirect to login/signup page
      } else {
        setHasToken(true);
      }
    }
  }, [isClient, router]);

  if (!isClient || !hasToken) {
    return null; // or loading spinner
  }

  return <>{children}</>;
}
