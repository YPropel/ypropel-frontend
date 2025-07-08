import React, { useState, useEffect } from "react";
import AuthGuard from "../components/AuthGuard";

type Member = {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  title?: string;
  university?: string;
  major?: string;
  experience_level?: string;
  skills?: string;
  company?: string;
  courses_completed?: string;
  country?: string;
  state?: string;
  city?: string;
  birthdate?: string;
  volunteering_work?: string;
  projects_completed?: string;
  photo_url?: string;
};

function EditMemberForm({
  memberId,
  onUpdateSuccess,
  onDeleteSuccess,
}: {
  memberId: number;
  onUpdateSuccess: (updatedMember: Member) => void;
  onDeleteSuccess: () => void;
}) {
  const [member, setMember] = useState<Member | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }
    fetch(`http://localhost:4000/users/${memberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch member details");
        return res.json();
      })
      .then((data: Member) => {
        setMember(data);
        setSelectedCountry(data.country || "");
        setSelectedState(data.state || "");
        setSelectedCity(data.city || "");
      })
      .catch((err) => setError(err.message));
  }, [memberId]);

  useEffect(() => {
    fetch("http://localhost:4000/countries")
      .then((res) => res.json())
      .then(setCountries)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      setSelectedState("");
      return;
    }
    fetch(`http://localhost:4000/us-states?country=${encodeURIComponent(selectedCountry)}`)
      .then((res) => res.json())
      .then(setStates)
      .catch(console.error);
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      setSelectedCity("");
      return;
    }
    fetch(`http://localhost:4000/us-cities?state=${encodeURIComponent(selectedState)}`)
      .then((res) => res.json())
      .then(setCities)
      .catch(console.error);
  }, [selectedState]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!member) return <p>Loading member info...</p>;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setMember((prev) => (prev ? { ...prev, [name]: value } : prev));
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedCountry(val);
    setSelectedState("");
    setSelectedCity("");
    setMember((prev) => (prev ? { ...prev, country: val, state: "", city: "" } : prev));
  }

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedState(val);
    setSelectedCity("");
    setMember((prev) => (prev ? { ...prev, state: val, city: "" } : prev));
  }

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedCity(val);
    setMember((prev) => (prev ? { ...prev, city: val } : prev));
  }

  async function uploadImageToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ypropel_preset");

    const res = await fetch("https://api.cloudinary.com/v1_1/denggbgma/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      let photo_url = member?.photo_url || "";
      if (photoFile) {
        photo_url = await uploadImageToCloudinary(photoFile);
      }

      const updatedMember = {
        ...member,
        photo_url,
      };

      const res = await fetch(`http://localhost:4000/users/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedMember),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Update failed: ${res.status} - ${text}`);
      }

      const updatedData = await res.json();
      onUpdateSuccess(updatedData);

      window.dispatchEvent(new Event("profileUpdated"));
      localStorage.setItem("profileUpdatedAt", Date.now().toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirmed() {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`http://localhost:4000/users/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delete failed: ${res.status} - ${text}`);
      }

      alert("Your account has been deleted.");
      onDeleteSuccess();
    } catch (err: any) {
      alert(`Error deleting account: ${err.message}`);
    } finally {
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded mt-10">
        {/* Name */}
        <label className="block mb-2">
          Name:
          <input
            type="text"
            name="name"
            value={member.name || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </label>

        {/* Email */}
        <label className="block mb-2">
          Email:
          <input
            type="email"
            name="email"
            value={member.email || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </label>

        {/* Title */}
        <label className="block mb-2">
          Title:
          <input
            type="text"
            name="title"
            value={member.title || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* University */}
        <label className="block mb-2">
          University:
          <input
            type="text"
            name="university"
            value={member.university || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Major */}
        <label className="block mb-2">
          Major:
          <input
            type="text"
            name="major"
            value={member.major || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Experience Level */}
        <label className="block mb-2">
          Experience Level:
          <input
            type="text"
            name="experience_level"
            value={member.experience_level || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Skills */}
        <label className="block mb-2">
          Skills:
          <textarea
            name="skills"
            value={member.skills || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Company */}
        <label className="block mb-2">
          Company:
          <input
            type="text"
            name="company"
            value={member.company || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Courses Completed */}
        <label className="block mb-2">
          Courses Completed:
          <input
            type="text"
            name="courses_completed"
            value={member.courses_completed || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Country Dropdown */}
        <label className="block mb-2">
          Country:
          <select
            name="country"
            value={selectedCountry}
            onChange={handleCountryChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-1">Saved: {member?.country || "None"}</p>
        </label>

        {/* State Dropdown */}
        <label className="block mb-2">
          State:
          <select
            name="state"
            value={selectedState}
            onChange={handleStateChange}
            disabled={!selectedCountry}
            className="w-full p-2 border rounded"
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-1">Saved: {member?.state || "None"}</p>
        </label>

        {/* City Dropdown */}
        <label className="block mb-2">
          City:
          <select
            name="city"
            value={selectedCity}
            onChange={handleCityChange}
            disabled={!selectedState}
            className="w-full p-2 border rounded"
          >
            <option value="">Select city</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-1">Saved: {member?.city || "None"}</p>
        </label>

        {/* Birthdate */}
        <label className="block mb-2">
          Birthdate:
          <input
            type="date"
            name="birthdate"
            value={member.birthdate?.split("T")[0] || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Volunteering Work */}
        <label className="block mb-2">
          Volunteering Work:
          <textarea
            name="volunteering_work"
            value={member.volunteering_work || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Projects Completed */}
        <label className="block mb-4">
          Projects Completed:
          <textarea
            name="projects_completed"
            value={member.projects_completed || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Upload Profile Photo */}
        <label className="block mb-4">
          Upload Profile Photo:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setPhotoFile(e.target.files[0]);
              }
            }}
            className="w-full p-2 border rounded"
          />
        </label>

        {/* Buttons */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete Account
        </button>

        {error && <p className="mt-2 text-red-600">{error}</p>}
      </form>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 max-w-sm w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Account Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete your account? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProfilePage() {
  const [loggedInMemberId, setLoggedInMemberId] = React.useState<number | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    async function fetchCurrentUser() {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not logged in");
        setLoadingUser(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:4000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch user profile");
        }
        const user = await res.json();
        setLoggedInMemberId(user.id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingUser(false);
      }
    }

    fetchCurrentUser();
  }, []);

  if (loadingUser) return <p>Loading profile...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!loggedInMemberId) return <p>User ID not found.</p>;

  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        <EditMemberForm
          memberId={loggedInMemberId}
          onUpdateSuccess={() => alert("Profile updated!")}
          onDeleteSuccess={() => {
            window.location.href = "/";
          }}
        />
      </div>
    </AuthGuard>
  );
}
