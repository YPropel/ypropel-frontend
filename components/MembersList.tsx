import React, { useState } from "react";
import Avatar from "../components/Avatar";

type UserType = {
  id: number;
  name: string;
  photo_url?: string;
};

type MembersListProps = {
  recentMembers: UserType[];
  otherMembers: UserType[];
  unreadCounts: Record<number, number>;
  onMemberClick: (user: UserType) => void;
  selectedUserId?: number | null;
};

export default function MembersList({
   recentMembers,
  otherMembers,
  unreadCounts,
  onMemberClick,
  selectedUserId,
}: MembersListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filterMembers = (members: UserType[]) =>
    members.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
