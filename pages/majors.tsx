import React from "react";
import AuthGuard from "../components/AuthGuard";

type Major = {
  id: string;
  title: string;
  description: string;
  popularUniversities: string[];
  imageUrl: string;  // New: URL to an image representing the major
};

const mockMajors: Major[] = [
  {
    id: "major1",
    title: "Computer Science",
    description: "Study of computation, programming, and information processing.",
    popularUniversities: ["MIT", "Stanford University", "Carnegie Mellon University"],
    imageUrl: "/majors/computer-science.jpg",
  },
  {
    id: "major2",
    title: "Business Administration",
    description: "Focuses on business management, finance, and marketing.",
    popularUniversities: ["Harvard University", "Wharton School", "London Business School"],
    imageUrl: "/majors/business-administration.jpg",
  },
  {
    id: "major3",
    title: "Psychology",
    description: "Study of mind and behavior, exploring cognitive, emotional, and social processes.",
    popularUniversities: ["University of Oxford", "University of Cambridge", "Stanford University"],
    imageUrl: "/majors/psychology.jpg",
  },
  // Add more mock majors as needed
];

export default function Majors() {
  const sortedMajors = [...mockMajors].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <AuthGuard>
    <div className="max-w-7xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-4xl font-bold text-blue-900 mb-4">Majors</h1>
      <div className="flex flex-col space-y-6">
        {sortedMajors.map((major) => (
          <div
            key={major.id}
            className="flex flex-col md:flex-row border rounded shadow hover:shadow-lg transition p-4"
          >
            {/* Details Left */}
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-semibold text-blue-800 mb-2">{major.title}</h2>
              <p className="text-gray-800 mb-4">{major.description}</p>
              {major.popularUniversities.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Popular Universities:</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {major.popularUniversities.map((uni, idx) => (
                      <li key={idx}>{uni}</li>
                    ))}
                  </ul>
                </div>
              )}
              <a
                href="#"
                className="mt-4 inline-block text-blue-700 font-semibold hover:underline"
              >
                Learn More
              </a>
            </div>

            {/* Image Right */}
            <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-4 w-full md:w-48 h-32 rounded overflow-hidden">
              <img
                src={major.imageUrl}
                alt={`${major.title} image`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
    </AuthGuard>
  );
}
