import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient"; // Adjust the import based on your project structure

const CompanyDetailsPage = () => {
  const [company, setCompany] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { companyId } = router.query; // Get companyId from the URL

  useEffect(() => {
    if (!companyId) return; // Don't fetch if companyId is not available yet

    const fetchCompanyDetails = async () => {
      try {
        const response = await apiFetch(`/companies/${companyId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const companyData = await response.json();
          setCompany(companyData);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch company details");
        }
      } catch (error) {
        setError("Something went wrong. Please try again later.");
      }
    };

    fetchCompanyDetails();
  }, [companyId]);

  const handleAddJob = () => {
    // Redirect to job posting page with companyId in the query string
    router.push(`/post-job?companyId=${companyId}`);
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!company) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold">Company Profile</h2>
      <div className="space-y-4">
        <div>
          <strong>Company Name:</strong> {company.name}
        </div>
        <div>
          <strong>Description:</strong> {company.description}
        </div>
        <div>
          <strong>Location:</strong> {company.location}
        </div>
        <div>
          <strong>Industry:</strong> {company.industry}
        </div>
        <div>
          {company.logo_url && <img src={company.logo_url} alt="Company Logo" />}
        </div>
      </div>

      <button
        onClick={handleAddJob}
        className="mt-4 px-4 py-2 bg-blue-500 text-white"
      >
        Add Job
      </button>
    </div>
  );
};

export default CompanyDetailsPage;
