import AuthGuard from "../components/AuthGuard";
import Link from "next/link";

const resources = [
  {
    title: "Majors",
    href: "/majors",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752123150/photo-1659080928170-b9924d616f04_fjrbg5.jpg",
    description: "Explore different academic majors and find your best fit.",
  },
  {
    title: "Universities",
    href: "/universities",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752122434/photo-1751815645850-25bebe194544_wolxfg.jpg",
    description: "Discover universities and what they offer for your future studies.",
  },
  {
    title: "Music Education",
    href: "/music-majors",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752121874/photo-1710283246021-5e5631f6ae93_baqdt7.jpg",
    description: "Learn about music education programs and career paths.",
  },
  {
    title: "Pre-college Summer Programs",
    href: "/pre-college-summer",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752123423/photo-1750614033417-c7e646e6a1f4_w77pwh.jpg",
    description: "Find summer programs to prepare for college life and academics.",
  },
  {
    title: "Trade Schools",
    href: "/trade-schools",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752121945/photo-1750420919650-0f04c105a6a8_o6s818.jpg",
    description: "Explore trade schools offering hands-on career training.",
  },
  {
    title: "Hourly Jobs Listing",
    href: "/jobs?type=hourly",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752122378/photo-1736813133787-043576f3d502_fx9ehi.jpg",
    description: "Browse part-time and hourly job opportunities for students.",
  },
];

export default function HighSchoolResources() {
  return (
    <AuthGuard>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-10 text-center">
          High School Student Resources
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {resources.map(({ title, href, coverPhoto, description }) => (
            <Link key={href} href={href} legacyBehavior>
              <a className="block rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white overflow-hidden cursor-pointer">
                <img
                  src={coverPhoto}
                  alt={title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-blue-800 mb-2">{title}</h2>
                  <p className="text-green-600 text-sm">{description}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
