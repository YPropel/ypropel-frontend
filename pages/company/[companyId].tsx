import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../../apiClient";

const CompanyDetailsPage = () => {
  const [company, setCompany] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();
  const { companyId } = router.query;
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setLoggedInUserId(userId);
  }, []);

  // Fetch company details
  useEffect(() => {
    if (!companyId) return;

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
      } catch {
        setError("Something went wrong in fetching company details. Please try again later.");
      }
    };

    fetchCompanyDetails();
  }, [companyId]);

  // Fetch user subscription status (company premium)
  useEffect(() => {
    const fetchUserPremiumStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await apiFetch("/users/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setIsPremium(!!userData.is_company_premium);
        }
      } catch {
        // silently fail or handle if needed
      }
    };

    fetchUserPremiumStatus();
  }, []);

  const handleAddJob = () => {
    if (!companyId) return;
    router.push(`/PostJob?companyId=${companyId}`);
  };

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
        body: JSON.stringify({ companyId, userId }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Company deleted successfully");
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete company");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    }
  };

  const handleCancelSubscription = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to cancel subscription.");
      return;
    }

    setCancelLoading(true);
    try {
      const response = await apiFetch("/payment/cancel-subscription", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("Subscription canceled successfully. You will lose premium access.");
        setIsPremium(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to cancel subscription.");
      }
    } catch (err) {
      alert("Error canceling subscription. Please try again later.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;

  if (!company) return <p>Loading...</p>;

  const userOwnsCompany = String(company.user_id) === String(loggedInUserId);

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-4">
        <div><strong>Company Name:</strong> {company.name}</div>
        <div><strong>About:</strong> {company.description}</div>
        <div><strong>Location:</strong> {company.location}</div>
        <div><strong>Industry:</strong> {company.industry}</div>
        <div>
          {company.logo_url && (
            <img
              src={company.logo_url}
              alt="Company Logo"
              className="mt-4"
              style={{ maxWidth: "200px", height: "auto" }}
            />
          )}
        </div>
      </div>

      {userOwnsCompany && (
        <div className="mt-6 flex space-x-4">
          <button onClick={handleAddJob} className="px-4 py-2 bg-blue-500 text-white">
            Add Job
          </button>

          <button onClick={handleDeleteCompany} className="px-4 py-2 bg-red-500 text-white">
            Delete Company
          </button>

          {isPremium && (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className={`px-4 py-2 text-white rounded ${
                cancelLoading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-600"
              }`}
              title="Cancel your premium subscription"
            >
              {cancelLoading ? "Cancelling..." : "Cancel Premium Subscription"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyDetailsPage;
