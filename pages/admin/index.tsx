//-- This page is the backend of NewsAdmin and all other backend components
//  which is the admin dashboord where admin 
// 1- can post news updates to the frontend News and Updates section
//it covers Submit news post and delete news post 
//Note: the News and update delete route for admin is in the ypropel-backend index.tsx


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
//--- Open admin dashboard if user has "admin" role
export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      console.warn("❌ No token found.");
      setIsAdmin(false);
      router.push("/unauthorized");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      console.log("🔍 Decoded Token:", decoded);
      console.log("🔐 Role from localStorage:", role);

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

  if (isAdmin === null) return null;
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
