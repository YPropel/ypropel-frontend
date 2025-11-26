import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient";

const CompanyDetailsPage = () => {
  const [company, setCompany] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { companyId } = router.query; // Assuming companyId is passed in the URL
  
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    
    const userId = localStorage.getItem("userId");
    setLoggedInUserId(userId); // save for comparison

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

  // Handle Delete Company
  const handleDeleteCompany = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setError("User is not logged in.");
      return;
    }

    try {
          const response = await apiFetch("/companies/delete", {
        method: "DELETE",
        body: JSON.stringify({ companyId }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });


      if (response.ok) {
        alert("Company deleted successfully");
        // Redirect to dashboard or another page after deletion
         // ✅ Redirect to create-company page
      router.push("/CreateCompany");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete company");
      }
    } catch (error) {
      setError("Something went wrong. Please try again later.");
    }
  };

  const handleAddJob = () => {
    if (!companyId) return;

    // Redirect to PostJob page with the companyId as a query parameter
    router.push(`/postjob?companyId=${companyId}`);
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
        <div>
  {company.logo_url && <img src={company.logo_url} alt="Company Logo" />}
</div>

        </div>
      </div>
      
     <div className="mt-4 space-x-4">
          <button
            onClick={handleAddJob}
            className="px-4 py-2 bg-blue-500 text-white"
          >
            Add Job
          </button>
        </div>

        <div className="mt-4 space-x-4"></div>
          <button
            onClick={handleDeleteCompany}
            className="px-4 py-2 bg-red-500 text-white"
          >
            Delete Company
          </button>

        </div>

     );
};

export default CompanyDetailsPage;
