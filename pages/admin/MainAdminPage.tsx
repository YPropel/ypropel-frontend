import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import jwtDecode from "jwt-decode";
import { apiFetch } from "../../apiClient";

const adminPages = [
  { label: "Articles", href: "/admin/articles" },
  { label: "Import Jobs", href: "/admin/import-jobs" },
  { label: "News", href: "/admin/news" },
  { label: "Job Fairs", href: "/admin/job-fairs" },
  { label: "Mini-Courses", href: "/admin/mini-courses" },
  { label: "Summer Programs", href: "/admin/summer-programs" },
];

type DecodedToken = {
  userId?: number;
  is_admin?: boolean | string | number;
  [key: string]: any;
};

export default function AdminMainPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/unauthorized");
        return;
      }

      try {
        const decoded: DecodedToken = jwtDecode(token);
        const adminFlag =
          decoded.is_admin === true ||
          decoded.is_admin === "true" ||
          decoded.is_admin === 1 ||
          String(decoded.is_admin).toLowerCase() === "true";

        if (!adminFlag) {
          router.push("/unauthorized");
          return;
        }

        // Optional: verify with backend to ensure token is valid and user is admin
        const res = await apiFetch("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          router.push("/unauthorized");
          return;
        }
        const user = await res.json();
        if (!user.is_admin) {
          router.push("/unauthorized");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check failed:", error);
        router.push("/unauthorized");
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return <p className="p-6 text-center">Checking admin permissions...</p>;
  }

  if (!isAdmin) {
    // Redirecting or showing nothing while redirect happens
    return null;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded shadow my-10">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Admin Dashboard</h1>
      <ul className="space-y-4 text-lg">
        {adminPages.map(({ label, href }) => (
          <li key={href}>
            <Link href={href}>
              <a className="text-blue-700 hover:underline">{label}</a>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
