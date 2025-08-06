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

    const userId = localStorage.getItem("userId"); // Get userId from local storage (ensure this is set on login)

    if (!userId) {
      setError("User is not logged in.");
      return;
    }


     //------ Handle logo upload if file is provided
    let logoUrlToSend = logoUrl;
    if (logo) {
      // Upload logo to a service like Cloudinary (you can replace this with your service)
      try {
        const formData = new FormData();
        formData.append("file", logo);
        formData.append("upload_preset", "your_upload_preset"); // Set your Cloudinary upload preset

        const cloudinaryResponse = await fetch("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", {
          method: "POST",
          body: formData,
        });

        const data = await cloudinaryResponse.json();
        logoUrlToSend = data.secure_url; // Get the secure URL from Cloudinary
      } catch (error) {
        setError("Logo upload failed. Please try again.");
        return;
      }
    }
    //-----Handel Logo end--
    try {
      const response = await apiFetch("/companies", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          location,
          industry,
          //logoUrl,
          logoUrl: logoUrlToSend, // Send the logo URL to the backend
          userId, // Send userId in the body of the request
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const companyData = await response.json(); // Assuming companyId is returned here
        const companyId = companyData.id; // Get the companyId from the response

        // Save companyId to localStorage
        localStorage.setItem("companyId", companyId.toString());

        // Redirect to the company details page after creating the company profile
        router.push(`/company/${companyId}`);
      } else {
        const errorData = await response.json();
        if (errorData.error === "You already have a company profile.") {
          // If user already has a company, show the error and stay on the same page
          setError(errorData.error);
          setCompanyExists(true); // Set state to indicate the user already has a company
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
