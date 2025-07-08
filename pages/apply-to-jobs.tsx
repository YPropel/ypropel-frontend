import React from "react";
import { useRouter } from "next/router";

const jobGroups = [
  {
    label: "Internships",
    type: "internship",
    description: "Explore internship opportunities to gain experience.",
    image: "/images/internships.jpg",
  },
  {
    label: "Entry-level Roles",
    type: "entry_level",
    description: "Find full-time entry-level job openings.",
    image: "/images/junior.jpg",
  },
  {
    label: "Hourly Roles",
    type: "hourly",
    description: "Browse part-time and hourly job opportunities.",
    image: "/images/hourly.avif",
  },
];

export default function JobsLandingPage() {
  const router = useRouter();

  const handleCardClick = (type: string) => {
    router.push(`/jobs?type=${type}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-extrabold mb-10 text-center">
        Explore Early-Career Opportunities
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {jobGroups.map(({ label, type, description, image }) => (
          <div
            key={type}
            onClick={() => handleCardClick(type)}
            className="cursor-pointer border rounded-lg p-6 shadow hover:shadow-lg transition flex flex-col"
          >
            <img
              src={image}
              alt={label}
              className="w-full h-40 object-cover rounded mb-4"
            />
            <h2 className="text-xl font-semibold mb-2">{label}</h2>
            <p className="text-gray-600 flex-grow">{description}</p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick(type);
              }}
              className="mt-4 self-center bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition"
            >
              Explore & Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
