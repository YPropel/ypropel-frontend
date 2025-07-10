import React, { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
import ChatWindow from "../components/ChatWindow";
import { apiFetch } from "../apiClient";

type Member = {
  id: number;
  name: string;
  username?: string;
  email: string;
  tagline?: string;
  role?: string;
  staffReasons?: string;
  flagged?: string;
  createdAt?: string;
  updatedAt?: string;
  lastSeenAt?: string;
  status?: string;
  emailStatus?: string;
  locale?: string;
  fields_School_Name?: string;
  fields_Major?: string;
  fields_School?: string;
  fields_SKL?: string;
  fields_country?: string;
  fields_ResumecopyandPaste?: string;
  fields_birthday?: string;
  fields_CCC?: string;
  fields_company?: string;
  photo_url?: string;
  skills?: string;
  experience_level?: string;
  major?: string;
  major_id?: number | null;
  university?: string;
  title?: string;
  company?: string;
  birthdate?: string;
};

// New helper component for expandable text
function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 100;
  const isLong = text.length > maxLength;

  return (
    <p className="text-sm mt-1">
      <strong>Skills:</strong>{" "}
      {expanded || !isLong ? text : text.slice(0, maxLength) + "..."}{" "}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:underline focus:outline-none"
          aria-label={expanded ? "Show less skills" : "Show more skills"}
          type="button"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </p>
  );
}

export default function MembersDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [experienceFilter, setExperienceFilter] = useState("");
  const [majorFilter, setMajorFilter] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [chatWithMember, setChatWithMember] = useState<Member | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be signed in to view members.");
      setLoading(false);
      return;
    }

    apiFetch("/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch members: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setMembers(data);
        setFilteredMembers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching members:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const majorMap = new Map<string | number, string>();
  members.forEach((m) => {
    if (m.major_id != null && m.major) {
      majorMap.set(m.major_id, m.major);
    } else if (m.major) {
      majorMap.set(m.major, m.major);
    }
  });
  const majorOptionsCombined = Array.from(majorMap.entries()).map(([key, name]) => ({
    id: key,
    name,
  }));

  const experienceOptions = Array.from(
    new Set(members.map((m) => m.experience_level).filter(Boolean))
  );
  const universityOptions = Array.from(
    new Set(members.map((m) => m.university).filter(Boolean))
  );

  useEffect(() => {
    let filtered = members;

    if (experienceFilter)
      filtered = filtered.filter(
        (m) => m.experience_level === experienceFilter
      );

    if (majorFilter) {
      filtered = filtered.filter(
        (m) =>
          String(m.major_id) === String(majorFilter) ||
          m.major === majorFilter
      );
    }

    if (universityFilter)
      filtered = filtered.filter((m) => m.university === universityFilter);

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(lowerTerm) ||
          (m.skills && m.skills.toLowerCase().includes(lowerTerm))
      );
    }

    setFilteredMembers(filtered);
  }, [experienceFilter, majorFilter, universityFilter, searchTerm, members]);

  if (loading) return <p className="p-6 text-center">Loading members...</p>;
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Members Directory</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded flex-grow min-w-[200px]"
        />
        <select
          value={experienceFilter}
          onChange={(e) => setExperienceFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Experience Levels</option>
          {experienceOptions.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <select
          value={majorFilter}
          onChange={(e) => setMajorFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Majors</option>
          {majorOptionsCombined.map(({ id, name }) => (
            <option key={String(id)} value={String(id)}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={universityFilter}
          onChange={(e) => setUniversityFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Universities</option>
          {universityOptions.map((uni) => (
            <option key={uni} value={uni}>
              {uni}
            </option>
          ))}
        </select>
      </div>

      {/* Members list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="border rounded p-4 flex items-center gap-4 shadow"
            >
              <Avatar
                name={member.name}
                photoUrl={member.photo_url}
                size={60}  // Smaller avatar size
              />

              <div className="flex-grow">
                <h2 className="text-2xl font-bold text-[#001f3f]">{member.name}</h2> {/* Bigger name */}
                {member.title && member.title.trim() !== "" && (
                  <p className="text-sm font-bold text-[#001f3f]">{member.title}</p>
                )}
                {(member.experience_level || member.major || member.university) && (
                  <p className="text-sm text-gray-600">
                    {[member.experience_level, member.major, member.university]
                      .filter((val) => val && val.trim() !== "")
                      .join(" | ")}
                  </p>
                )}
                {member.skills && member.skills.trim() !== "" && (
                  <ExpandableText text={member.skills} />
                )}
              </div>

              <button
                onClick={() => setChatWithMember(member)}
                className="ml-auto bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Message
              </button>
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-600">
            No members found.
          </p>
        )}
      </div>

      {/* Chat modal */}
      {chatWithMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-3xl max-h-[80vh] overflow-auto relative">
            <button
              onClick={() => setChatWithMember(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close chat"
            >
              &times;
            </button>
            <ChatWindow otherUserId={chatWithMember.id} />
          </div>
        </div>
      )}
    </div>
  );
}
