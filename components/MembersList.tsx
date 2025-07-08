import React, { useEffect, useState } from "react";
import Avatar from "../components/Avatar";

type UserType = {
  id: number;
  name: string;
  photo_url?: string;
};

export default function MembersList({
  onMemberClick,
  selectedUserId,
}: {
  onMemberClick: (user: UserType) => void;
  selectedUserId?: number | null;
}) {
  const [recentMembers, setRecentMembers] = useState<UserType[]>([]);
  const [otherMembers, setOtherMembers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    async function fetchMembersAndUnread() {
      try {
        // Fetch combined members
        const resMembers = await fetch("http://localhost:4000/members/combined-list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resMembers.ok) throw new Error("Failed to fetch members");
        const data = await resMembers.json();
        setRecentMembers(data.recentMembers);
        setOtherMembers(data.otherMembers);

        // Fetch unread counts
        const resUnread = await fetch("http://localhost:4000/messages/unread-count-by-sender", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resUnread.ok) throw new Error("Failed to fetch unread counts");
        const unreadData: Record<number, number> = await resUnread.json();
        setUnreadCounts(unreadData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchMembersAndUnread();
  }, []);

  // Filter function
  const filterMembers = (members: UserType[]) =>
    members.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) return <p>Loading members...</p>;

  return (
    <div>
      {/* Search Box */}
      <input
        type="text"
        placeholder="Search members..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full px-3 py-2 border rounded"
      />

      <h2 className="text-xl font-semibold mb-2">Recent Chats</h2>
      {filterMembers(recentMembers).length === 0 && <p>No recent chats.</p>}
      {filterMembers(recentMembers).map((user) => (
        <div
          key={user.id}
          className={`flex items-center justify-between mb-2 cursor-pointer hover:bg-gray-100 rounded p-1 ${
            selectedUserId === user.id ? "bg-blue-200" : ""
          }`}
          onClick={() => onMemberClick(user)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onMemberClick(user);
          }}
        >
          <div className="flex items-center">
            <Avatar name={user.name} photoUrl={user.photo_url} size={32} />
            <span className="ml-2">{user.name}</span>
          </div>

          {/* Red badge for unread count */}
          {unreadCounts[user.id] > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCounts[user.id]}
            </span>
          )}
        </div>
      ))}

      <h2 className="text-xl font-semibold mt-6 mb-2">All Members</h2>
      {filterMembers(otherMembers).length === 0 && <p>No other members found.</p>}
      {filterMembers(otherMembers).map((user) => (
        <div
          key={user.id}
          className={`flex items-center justify-between mb-2 cursor-pointer hover:bg-gray-100 rounded p-1 ${
            selectedUserId === user.id ? "bg-blue-200" : ""
          }`}
          onClick={() => onMemberClick(user)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onMemberClick(user);
          }}
        >
          <div className="flex items-center">
            <Avatar name={user.name} photoUrl={user.photo_url} size={32} />
            <span className="ml-2">{user.name}</span>
          </div>

          {/* Red badge for unread count */}
          {unreadCounts[user.id] > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCounts[user.id]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
