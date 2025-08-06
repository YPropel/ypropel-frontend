import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient";

type Company = {
  id: number;
  name: string;
  industry: string;
  location: string;
  description: string;
  logo_url: string;
};

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await apiFetch("/companies");
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load companies.");
        }
      } catch (error) {
        setError("Something went wrong.");
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">All Companies</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="border p-4 rounded shadow-sm">
            {company.logo_url && (
              <img src={company.logo_url} alt={company.name} className="h-20 mb-2 object-contain" />
            )}
            <h2 className="text-xl font-semibold">{company.name}</h2>
            <p><strong>Industry:</strong> {company.industry}</p>
            <p><strong>Location:</strong> {company.location}</p>
            
            <button
              onClick={() => router.push(`/company/${company.id}`)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompaniesPage;
