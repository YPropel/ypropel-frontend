import Link from "next/link";
import { useEffect, useState } from "react";

type UserProfile = {
  name: string;
  photo_url?: string;
  experience_level?: string;
};

const sidebarMenu = [
  {
    title: " Students' & Early-Career Resources",
    items: [
      { label: "Home", href: "/" },
      { label: "Latest News & Updates", href: "/news-updates" },
      { label: "Latest Job Opportunites", href: "/apply-to-jobs" },
      { label: "Discussion Board & Study Circle", href: "/discussion-board" },
      { label: "Upload Your Resume", href: "/upload-resume" },
      { label: "PitchPoint Video Hub", href: "/pitchpoint" },
      { label: "Mini-Courses", href: "/mini-courses" },
      { label: "High School Students Resources", href: "/high-school-resources" },
      { label: "Pre-college Summer Programs", href: "/pre-college-summer" },
      { label: "University Students Resources", href: "/university-students-resources" },
      { label: "US Universities", href: "/universities" },
      { label: "Jobs Fair", href: "/job-fairs" },
      { label: "📰 Articles", href: "/articles" },
      { label: "Freelance", href: "/freelance" },
      { label: "Members Directory", href: "/members" },
      { label: "View-Edit Profile", href: "/profile" },
      { label: "About Us", href: "/about" },
    ],
  },
];

const navyColor = "#001F54"; // Navy hex color

export default function Sidebar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchProfile = async (id: string | null) => {
    if (!id) {
      setProfile(null);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setProfile(null);
      return;
    }
    const res = await fetch(`http://localhost:4000/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setUserId(id);
    fetchProfile(id);

    const onLogout = () => {
      setUserId(null);
      setProfile(null);
    };
    window.addEventListener("logout", onLogout);

    return () => {
      window.removeEventListener("logout", onLogout);
    };
  }, []);

  useEffect(() => {
    fetchProfile(userId);
  }, [userId]);

  // Listen for token/userId changes, login/logout events, AND profileUpdated event
  useEffect(() => {
    function onStorageChange(e: StorageEvent) {
      if (e.key === "token" || e.key === "userId") {
        const newId = localStorage.getItem("userId");
        setUserId(newId);
        if (newId) {
          fetchProfile(newId);
        } else {
          setProfile(null);
        }
      }
    }

    function onLogout() {
      setUserId(null);
      setProfile(null);
    }
    function onLogin() {
      const newId = localStorage.getItem("userId");
      setUserId(newId);
      if (newId) {
        fetchProfile(newId);
      }
    }
    function onProfileUpdated() {
      if (userId) {
        fetchProfile(userId);
      }
    }

    window.addEventListener("storage", onStorageChange);
    window.addEventListener("logout", onLogout);
    window.addEventListener("login", onLogin);
    window.addEventListener("profileUpdated", onProfileUpdated);

    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("logout", onLogout);
      window.removeEventListener("login", onLogin);
      window.removeEventListener("profileUpdated", onProfileUpdated);
    };
  }, [userId]);

  return (
    <aside className="w-64 p-4 bg-white border-r border-gray-200 min-h-screen">
      {/* Profile badge */}
      {profile && (
        <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50 text-center shadow-sm">
         <img
  src={
    profile.photo_url && profile.photo_url.trim() !== ""
      ? `${profile.photo_url}?t=${new Date().getTime()}`
      : "/images/default-profile.png"
  }
  alt="Profile"
  className="w-16 h-16 rounded-full mx-auto object-cover"
  onError={(e) => {
    (e.target as HTMLImageElement).src = "/images/default-profile.png";
  }}
/>

          <h3 className="mt-2 font-semibold text-sm" style={{ color: navyColor }}>
            {profile.name}
          </h3>
          <p className="text-xs" style={{ color: navyColor }}>
            {profile.experience_level || "Student"}
          </p>
          <Link href="/profile" className="text-xs underline hover:text-blue-800" style={{ color: navyColor }}>
            Edit Profile
          </Link>
        </div>
      )}

      {/* Sidebar Menu */}
      {sidebarMenu.map((section, idx) => (
        <div key={idx} className="mb-8">
          <h2 className="font-bold mb-3" style={{ color: navyColor }}>
            {section.title}
          </h2>
          <ul className="space-y-2">
            {section.items.map((item, subIdx) => (
              <li key={subIdx}>
                <Link href={item.href} className="hover:underline" style={{ color: navyColor }}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
