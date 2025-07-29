import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type VisitData = {
  date: string;
  visitorsFromMembers: number;
  visitorsFromGuests: number;
  uniqueMemberVisits: number;
};

export default function VisitsReportGraph() {
  const router = useRouter();

  const [data, setData] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No auth token found. Please login.");
        setLoading(false);
        return;
      }

      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
      });

      try {
        const results = await Promise.all(
          dates.map(async (date) => {
            const response = await fetch(
              `${
                process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
              }/reports/visitors?date=${date}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch visits data for ${date}`);
            }

            const res = await response.json();

            return {
              date,
              visitorsFromMembers: res.visitorsFromMembers,
              visitorsFromGuests: res.visitorsFromGuests,
              uniqueMemberVisits: res.uniqueMemberVisits,
            };
          })
        );
        setData(results);
      } catch (err: any) {
        setError(err.message || "Failed to load visits data");
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, []);

  if (loading) return <p>Loading visit data...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <button
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        onClick={() => router.push("/admin/members-report")}
      >
        ← Back to Members Report
      </button>

      <h2 className="text-2xl font-bold mb-4">
        Unique Visits from Members and Guests (Last 7 Days)
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="uniqueMemberVisits"
            fill="#8884d8"
            name="Unique Member Visits"
          />
          <Bar
            dataKey="visitorsFromGuests"
            fill="#82ca9d"
            name="Visitors from Guests"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
