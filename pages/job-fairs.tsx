import React, { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient"; 

type JobFair = {
  id: number;
  title: string;
  description: string;
  location: string;
  start_datetime: string;
  website: string;
  cover_image_url?: string;
};

export default function JobFairsPage() {
  const [jobFairs, setJobFairs] = useState<JobFair[]>([]);
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  //const [availableStates, setAvailableStates] = useState<string[]>([]);
  type StateType = { name: string; abbreviation: string };
const [availableStates, setAvailableStates] = useState<StateType[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

//------function to Map the abbreviation to full state name before filtering
  const getStateNameByAbbreviation = (abbr: string) => {
  const found = availableStates.find((s) => s.abbreviation === abbr);
  return found ? found.name : abbr;
};


  useEffect(() => {
    const fetchJobFairs = async () => {
      try {
        const res = await apiFetch("/job-fairs");
        const data = await res.json();
        setJobFairs(data);
      } catch (error) {
        console.error("Failed to fetch job fairs:", error);
      }
    };
    fetchJobFairs();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await apiFetch("/us-states");
        const data = await res.json();
        setAvailableStates(data);
      } catch (error) {
        console.error("Failed to fetch states:", error);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (!stateFilter) {
      setAvailableCities([]);
      return;
    }

    const fetchCities = async () => {
      try {
        const res = await apiFetch(
          `/us-cities?state=${encodeURIComponent(stateFilter)}`
        );
        const data = await res.json();
        setAvailableCities(data);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      }
    };
    fetchCities();
  }, [stateFilter]);

  const filteredJobFairs = jobFairs
  .filter((job) => {
    const [stateName, city] = job.location.split(" - ");
    const filterStateName = stateFilter ? getStateNameByAbbreviation(stateFilter) : "";
    const matchState = stateFilter ? stateName === filterStateName : true;
    const matchCity = cityFilter ? city === cityFilter : true;
    return matchState && matchCity;
  })
  .sort((a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime());



  return (
      <AuthGuard>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Job Fairs</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setCityFilter("");
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="">All States</option>
          {availableStates.map((s) => (
  <option key={s.abbreviation} value={s.abbreviation}>
    {s.name}
  </option>
))}
        </select>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="border px-3 py-2 rounded"
          disabled={!stateFilter}
        >
          <option value="" disabled>
            {stateFilter ? "Select a City" : "Choose a State First"}
          </option>
          {availableCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filteredJobFairs.length === 0 ? (
        <p>No job fairs found.</p>
      ) : (
        <ul className="space-y-6">
          {filteredJobFairs.map((job) => (
            <li key={job.id} className="border rounded-lg p-4 shadow">
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <p className="text-sm text-gray-700 mt-1">{job.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                📍 {job.location} | 🕒{" "}
                {new Date(job.start_datetime).toLocaleString()}
              </p>
              <a
                href={job.website}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline mt-2 block"
              >
                Visit Website
              </a>
              <img
                src={
                  job.cover_image_url ||
                  "https://via.placeholder.com/300x200?text=Job+Fair"
                }
                alt={job.title}
                className="w-full max-w-sm mt-3 rounded"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/300x200?text=Job+Fair";
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
    </AuthGuard>
  );
}
