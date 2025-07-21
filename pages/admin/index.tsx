import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import dynamic from "next/dynamic";

const NewsAdmin = dynamic(() => import("@/components/admin/NewsAdmin"), { ssr: false });

type DecodedToken = {
  userId: number;
  email: string;
  is_admin: boolean | string | number;
  iat: number;
  exp: number;
};

// --- No change needed here ---

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // -------- CHANGED: Add check & redirect if no token --------
    if (!token) {
      console.warn("❌ No token found.");
      setIsAdmin(false);
      router.push("/unauthorized"); // keep as is, or redirect to login if preferred
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log("🔍 Decoded Token:", decoded);
      console.log("🔐 Role from localStorage:", role);

      // -------- CHANGED: Check is_admin field and role explicitly --------
      const isAdminValue =
        decoded.is_admin === true ||
        decoded.is_admin === "true" ||
        decoded.is_admin === 1 ||
        String(decoded.is_admin).toLowerCase() === "true" ||
        role === "admin";

      if (isAdminValue) {
        setIsAdmin(true);
      } else {
        console.warn("❌ Not admin user");
        setIsAdmin(false);
        router.push("/unauthorized");
      }
    } catch (err) {
      console.error("❌ Token decode error", err);
      setIsAdmin(false);
      router.push("/unauthorized");
    }
  }, [router]);

  // Wait while admin check completes
  if (isAdmin === null) return null;
  // Block non-admin users
  if (!isAdmin) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🛠️ Admin Dashboard</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">📰 Manage News Posts</h2>
        <NewsAdmin />
      </section>
    </div>
  );
}