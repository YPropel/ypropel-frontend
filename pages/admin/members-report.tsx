import React, { useState, useEffect } from "react";

type Member = {
  id: number;
  name: string;
  email: string;
};

export default function MembersReport() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [newMembersCount, setNewMembersCount] = useState<number | null>(null);
  const [visitorsMembers, setVisitorsMembers] = useState<number | null>(null);
  const [visitorsGuests, setVisitorsGuests] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch total members and members list once on mount
  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/members/report");
        if (!res.ok) throw new Error("Failed to fetch members report");
        const data = await res.json();
        setTotalMembers(data.totalMembers);
        setMembersList(data.members);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  // Fetch new members count and visitors for selected date
  useEffect(() => {
    async function fetchDateData() {
      setLoading(true);
      setError(null);
      try {
        const [newMembersRes, visitorsRes] = await Promise.all([
          fetch(`/members/report?date=${date}`),
          fetch(`/visitors/report?date=${date}`),
        ]);

        if (!newMembersRes.ok) throw new Error("Failed to fetch new members count");
        if (!visitorsRes.ok) throw new Error("Failed to fetch visitors report");

        const newMembersData = await newMembersRes.json();
        const visitorsData = await visitorsRes.json();

        setNewMembersCount(newMembersData.newMembersCount);
        setVisitorsMembers(visitorsData.visitorsFromMembers);
        setVisitorsGuests(visitorsData.visitorsFromGuests);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDateData();
  }, [date]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Members & Visitors Report</h1>

      <div className="mb-6">
        <label htmlFor="date" className="block font-semibold mb-1">
          Select Date:
        </label>
        <input
          id="date"
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <>
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Total Members: {totalMembers ?? "N/A"}</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">Name</th>
                  <th className="border border-gray-300 p-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {membersList.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center p-4">
                      No members found.
                    </td>
                  </tr>
                )}
                {membersList.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2">{member.name}</td>
                    <td className="border border-gray-300 p-2">{member.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Statistics for {date}</h2>
            <ul className="list-disc list-inside">
              <li>New Members Signed Up: {newMembersCount ?? "N/A"}</li>
              <li>Visitors from Members: {visitorsMembers ?? "N/A"}</li>
              <li>Visitors from Guests (non-members): {visitorsGuests ?? "N/A"}</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
