import React, { useState, useEffect } from "react";
import MembersList from "../components/MembersList";
import ChatWindow from "../components/ChatWindow";
import { apiFetch } from "../apiClient"; 

type Member = {
  id: number;
  name: string;
  photo_url?: string;
};

export default function ChatPage() {
  const [otherUserId, setOtherUserId] = useState<number | null>(null);
  const [recentChatMembers, setRecentChatMembers] = useState<Member[]>([]);
  const [otherMembers, setOtherMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    async function fetchMembers() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await apiFetch("/members/combined-list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();

        setRecentChatMembers(data.recentMembers);
        setOtherMembers(data.otherMembers);

        const resUnread = await apiFetch("/messages/unread-count-by-sender", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resUnread.ok) throw new Error("Failed to fetch unread counts");
        const unreadData: Record<number, number> = await resUnread.json();
        setUnreadCounts(unreadData);

        if (data.recentMembers.length > 0) {
          setOtherUserId(data.recentMembers[0].id);
        } else if (data.otherMembers.length > 0) {
          setOtherUserId(data.otherMembers[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

  // Listen for "messagesRead" event to refresh unread counts
  useEffect(() => {
    const handleMessagesRead = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const resUnread = await apiFetch("/messages/unread-count-by-sender", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resUnread.ok) throw new Error("Failed to fetch unread counts");
        const unreadData: Record<number, number> = await resUnread.json();
        setUnreadCounts(unreadData);
      } catch (error) {
        console.error("Failed to refresh unread counts:", error);
      }
    };

    window.addEventListener("messagesRead", handleMessagesRead);

    return () => {
      window.removeEventListener("messagesRead", handleMessagesRead);
    };
  }, []);

  const handleMemberClick = (user: Member) => {
    setOtherUserId(user.id);
  };

  if (loading) return <p className="p-4">Loading members...</p>;

  return (
    <div className="flex max-w-7xl mx-auto h-screen border rounded shadow">
      <div className="w-2/3 border-r overflow-auto" style={{ minHeight: "100vh" }}>
        {otherUserId ? (
          <ChatWindow otherUserId={otherUserId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a member to start chatting
          </div>
        )}
      </div>

      <div className="w-1/3 overflow-auto">
        <MembersList
          recentMembers={recentChatMembers}
          otherMembers={otherMembers}
          onMemberClick={handleMemberClick}
          selectedUserId={otherUserId}
          unreadCounts={unreadCounts}
        />
      </div>
    </div>
  );
}
