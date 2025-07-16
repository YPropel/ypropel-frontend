import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import * as jwtDecode from "jwt-decode";
import { apiFetch } from "../../apiClient";
import AuthGuard from "../../components/AuthGuard";

const adminPages = [
  { label: "Articles", href: "/admin/articles" },
  { label: "Import Jobs", href: "/admin/import-jobs" },
  { label: "News", href: "/admin/news" },
  { label: "Job Fairs", href: "/admin/job-fairs" },
  { label: "Mini-Courses", href: "/admin/mini-courses" },
  { label: "Summer Programs", href: "/admin/summer-programs" },
];

type DecodedToken = {
  is_admin?: boolean | string | number;
  [key: string]: any;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAdmin(false);
      router.push("/unauthorized");
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode.default(token);
      const role = localStorage.getItem("role");
      const adminCheck =
        decoded.is_admin === true ||
        decoded.is_admin === "true" ||
        decoded.is_admin === 1 ||
        String(decoded.is_admin).toLowerCase() === "true" ||
        role === "admin";

      if (adminCheck) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.push("/unauthorized");
      }
    } catch (error) {
      setIsAdmin(false);
      router.push("/unauthorized");
    }
  }, [router]);

  if (isAdmin === null) {
    return null; // or a loading spinner while checking
  }

  if (!isAdmin) {
    return null; // Redirect in progress or unauthorized
  }

  return (
    <AuthGuard>
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
    </AuthGuard>
  );
}
