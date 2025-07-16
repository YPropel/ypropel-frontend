// pages/admin/MainAdminPage.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const adminPages = [
  { label: "Articles", href: "/admin/articles" },
  { label: "Import Jobs", href: "/admin/import-jobs" },
  { label: "News", href: "/admin/news" },
  { label: "Job Fairs", href: "/admin/job-fairs" },
  { label: "Mini-Courses", href: "/admin/mini-courses" },
  { label: "Summer Programs", href: "/admin/summer-programs" },
];

export default function MainAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // Simple admin check based on localStorage flag "isAdmin"
    const adminFlag = localStorage.getItem("isAdmin");
    if (adminFlag === "true") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      router.push("/unauthorized"); // redirect if not admin
    }
  }, [router]);

  if (isAdmin === null) {
    return <p>Loading...</p>; // or spinner
  }

  if (!isAdmin) {
    return null; // user is redirected, so no content here
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
