import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { apiFetch } from "../../apiClient";

type VisitData = {
  date: string;
  visitorsFromMembers: number;
  visitorsFromGuests: number;
  uniqueMemberVisits: number;
};

export default function VisitsReportGraph() {
  const [data, setData] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      setError(null);

      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });

    try {
  const results = await Promise.all(
    dates.map(async (date) => {
      const res = await apiFetch(`/reports/visitors?date=${date}`);
      const data = await res.json();
      return {
        date,
        visitorsFromMembers: data.visitorsFromMembers,
        visitorsFromGuests: data.visitorsFromGuests,
        uniqueMemberVisits: data.uniqueMemberVisits,
      };
    })
  );
  setData(results);
} catch {
  setError("Failed to load visits data");
} finally {
  setLoading(false);
}
    };

    fetchVisits();
  }, []);

  if (loading) return <p>Loading visit data...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Unique Visits from Members and Guests (Last 7 Days)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="uniqueMemberVisits" fill="#8884d8" name="Unique Member Visits" />
          <Bar dataKey="visitorsFromGuests" fill="#82ca9d" name="Visitors from Guests" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
