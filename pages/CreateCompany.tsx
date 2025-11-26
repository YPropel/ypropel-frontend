import React, { useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../apiClient";

const CreateCompany = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [logo, setLogo] = useState<File | null>(null); // State to hold the logo file
  const [logoUrl, setLogoUrl] = useState(""); // State to hold the uploaded logo URL
  const [error, setError] = useState<string | null>(null);
  const [companyExists, setCompanyExists] = useState(false); // State to track if the user has a company
  const router = useRouter();


   const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setLogo(file);

      // Preview the image before uploading
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string); // Set the logoUrl for preview
      };
      reader.readAsDataURL(file); // Convert file to base64 string for preview
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!name || !description || !location || !industry) {
    setError("All fields are required.");
    return;
  }

        const token = localStorage.getItem("token");
        if (!token) {
          setError("User is not logged in.");
          return;
        }

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("industry", industry);

    if (logo) {
      formData.append("logo", logo); // key must match backend: .single("logo")
    }

    const response = await apiFetch("/companies", {
      method: "POST",
      body: formData,
      // DO NOT set Content-Type manually for FormData
    });

    if (response.ok) {
      const companyData = await response.json();
      const companyId = companyData.id;
      localStorage.setItem("companyId", companyId.toString());
      router.push(`/company/${companyId}`);
    } else {
      const errorData = await response.json();
      if (errorData.error === "You already have a company profile.") {
        setError(errorData.error);
        setCompanyExists(true);
      } else {
        setError(errorData.error || "Failed to create company profile");
      }
    }
  } catch (error) {
    setError("Something went wrong. Please try again later.");
  }
};


  // Function to navigate to the existing company profile page
  const navigateToProfile = () => {
    const companyId = localStorage.getItem("companyId");
    if (companyId) {
      router.push(`/company/${companyId}`);
    } else {
      setError("Company ID not found.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold">Create Your Company Profile</h2>

      {error && <p className="text-red-500">{error}</p>}

      {/* If the user already has a company, display a message and a button */}
      {companyExists && (
        <div className="mt-4">
          <p>You already have a company profile.</p>
          <button
            onClick={navigateToProfile}
            className="mt-2 px-4 py-2 bg-blue-500 text-white"
          >
            View Your Company Profile
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Company Name</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Description</label>
          <textarea
            className="w-full p-2 border border-gray-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Location</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block">Industry</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
          />
        </div>

        {/* Logo Upload Input */}
        <div>
          <label className="block">Logo</label>
          <input
            type="file"
            className="w-full p-2 border border-gray-300"
            onChange={handleLogoChange}
            accept="image/*" // Only allow image files
          />
          {logoUrl && (
            <div className="mt-2">
              <strong>Preview:</strong>
              <img src={logoUrl} alt="Logo Preview" className="mt-2" style={{ maxWidth: "200px" }} />
            </div>
          )}
        </div>


        <button type="submit" className="px-4 py-2 bg-blue-500 text-white">
          Create Profile
        </button>
      </form>
    </div>
  );
};

export default CreateCompany;
