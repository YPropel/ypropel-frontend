import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import SummerProgramsAdmin from "../../components/admin/SummerProgramsAdmin";

export default function AdminSummerProgramsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    // Optionally: decode token to check isAdmin flag
    // For now, assume token presence means authorized admin
    setIsAuthorized(true);
  }, [router]);

  if (isAuthorized === null) {
    // While checking auth, show loading or blank
    return <p>Loading...</p>;
  }

  if (isAuthorized === false) {
    // Just in case you want to handle unauthorized here
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-4">Manage Summer Programs</h1>
      <SummerProgramsAdmin />
    </div>
  );
}
