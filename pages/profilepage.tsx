import React, { useState, ChangeEvent, FormEvent } from "react";
import AuthGuard from "../components/AuthGuard";

const experienceLevels = [
  "University/College Student",
  "High School Student",
  "Vocational Student (Trade School)",
  "Postgraduate Student (Master’s/PhD)",
  "Graduate",
  "Entry-Level Professional",
  "Mid-Level Professional",
  "Experienced",
  "Other",
];

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    photo: null as File | null,
    title: "",
    schoolName: "",
    major: "",
    experienceLevel: "",
    skills: "",
    company: "",
    coursesCompleted: "",
    country: "",
    birthdate: "",
    volunteeringWork: "",
    projectsCompleted: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData((prev) => ({
        ...prev,
        photo: file,
      }));

      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // For now, alert profile data except photo file object (you can handle file upload separately)
    const { photo, ...rest } = profileData;
    alert(
      "Profile saved:\n" +
        JSON.stringify(rest, null, 2) +
        (photo ? "\n\nPhoto selected: " + photo.name : "")
    );

    // TODO: Implement API call to upload photo and save profile
  };

  return (
      <AuthGuard>
    <div className="max-w-4xl mx-auto py-8 px-6 bg-white rounded shadow">
      <h1 className="text-3xl font-semibold mb-6 text-blue-900">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex flex-col items-center">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile Preview"
              className="w-32 h-32 rounded-full object-cover mb-3 border border-gray-300"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 mb-3 flex items-center justify-center text-gray-400 text-lg border border-gray-300">
              No Photo
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="block"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block font-semibold mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={profileData.title}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your professional title"
          />
        </div>

        {/* University / School Name */}
        <div>
          <label htmlFor="schoolName" className="block font-semibold mb-1">
            University / School Name
          </label>
          <input
            type="text"
            id="schoolName"
            name="schoolName"
            value={profileData.schoolName}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="University or School you attended"
          />
        </div>

        {/* Major / Field of Study */}
        <div>
          <label htmlFor="major" className="block font-semibold mb-1">
            Major / Field of Study
          </label>
          <input
            type="text"
            id="major"
            name="major"
            value={profileData.major}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your major or field of study"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label htmlFor="experienceLevel" className="block font-semibold mb-1">
            Experience Level
          </label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            value={profileData.experienceLevel}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select your level of experience</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Skills */}
        <div>
          <label htmlFor="skills" className="block font-semibold mb-1">
            Skills
          </label>
          <textarea
            id="skills"
            name="skills"
            value={profileData.skills}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List your skills, separated by commas"
            rows={3}
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" className="block font-semibold mb-1">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={profileData.company}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Current or previous company"
          />
        </div>

        {/* Courses Completed */}
        <div>
          <label htmlFor="coursesCompleted" className="block font-semibold mb-1">
            Courses Completed
          </label>
          <textarea
            id="coursesCompleted"
            name="coursesCompleted"
            value={profileData.coursesCompleted}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List your completed courses"
            rows={3}
          />
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block font-semibold mb-1">
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={profileData.country}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Country of residence"
          />
        </div>

        {/* Birthdate */}
        <div>
          <label htmlFor="birthdate" className="block font-semibold mb-1">
            Birthdate
          </label>
          <input
            type="date"
            id="birthdate"
            name="birthdate"
            value={profileData.birthdate}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Volunteering Work */}
        <div>
          <label htmlFor="volunteeringWork" className="block font-semibold mb-1">
            Volunteering Work
          </label>
          <textarea
            id="volunteeringWork"
            name="volunteeringWork"
            value={profileData.volunteeringWork}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your volunteering work"
            rows={3}
          />
        </div>

        {/* Projects Completed */}
        <div>
          <label htmlFor="projectsCompleted" className="block font-semibold mb-1">
            Projects Completed
          </label>
          <textarea
            id="projectsCompleted"
            name="projectsCompleted"
            value={profileData.projectsCompleted}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your completed projects"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-3 rounded font-semibold hover:bg-blue-800 transition"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
      </AuthGuard>
  );
}
