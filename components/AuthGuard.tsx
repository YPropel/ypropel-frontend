import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";

type Props = {
  children: ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/main");
      } else {
        setIsVerified(true);
      }
    }
  }, [router]);

  if (!isVerified) {
    return null;
  }

  return <>{children}</>;
}
