"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiFetch } from "../apiClient";  // Adjust path as needed

export default function Topbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkLoginAndFetchUnread = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        setUnreadCount(0);
        return;
      }
      setIsLoggedIn(true);

      try {
        const res = await apiFetch("/messages/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch unread count");
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      } catch (e) {
        console.error(e);
      }
    };

    checkLoginAndFetchUnread();

    // Refresh unread count every 30 seconds
    const intervalId = setInterval(checkLoginAndFetchUnread, 30000);

    // Refresh on storage changes like logout/login
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "lastReadMessageTimestamp") {
        checkLoginAndFetchUnread();
      }
    };
    window.addEventListener("storage", onStorageChange);

    // Listen for custom event dispatched when messages are marked read
    const onMessagesRead = () => {
      checkLoginAndFetchUnread();
    };
    window.addEventListener("messagesRead", onMessagesRead);

    // NEW: Listen for login event to update topbar immediately after sign in/up
    const onLoginEvent = () => {
      checkLoginAndFetchUnread();
    };
    window.addEventListener("login", onLoginEvent);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("messagesRead", onMessagesRead);
      window.removeEventListener("login", onLoginEvent); // cleanup new listener
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.dispatchEvent(new Event("logout"));
    router.push("/main");
  };

  if (!mounted) return null; // don't render on server or until mounted

  return (
    <div className="flex justify-end items-center p-4 bg-white border-b shadow-sm space-x-4">
      {isLoggedIn && (
        <button
          onClick={() => router.push("/chat")}
          className="relative text-sm text-blue-600 underline hover:text-blue-800"
        >
          Chat
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      )}
      {isLoggedIn ? (
        <button
          onClick={handleLogout}
          className="text-sm text-blue-600 underline hover:text-blue-800"
        >
          Log out
        </button>
      ) : null}
    </div>
  );
}
