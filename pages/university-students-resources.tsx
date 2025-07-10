import AuthGuard from "../components/AuthGuard";
import Link from "next/link";

const universityResources = [
  {
    title: "Jobs",
    href: "/apply-to-jobs",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752125218/photo-1743178207203-1fd2014ba7b3_vcs2fq.jpg",
    description: "Explore job opportunities for university students.",
  },
  {
    title: "Jobs Fair",
    href: "/job-fairs",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752125429/photo-1698047681452-08eba22d0c64_mh3n0f.jpg",
    description: "Upcoming job fairs and events.",
  },
  {
    title: "Articles",
    href: "/articles",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752125502/photo-1747886084464-d07c4d90fd8d_tmkm9l.jpg",
    description: "Career advice and stories.",
  },
  {
    title: "Upload Resume",
    href: "/upload-resume",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752125457/photo-1729565756259-99ecbbe55323_x8lbcl.jpg",
    description: "Manage your resume.",
  },
  {
    title: "Freelance",
    href: "/freelance",
    coverPhoto: "https://res.cloudinary.com/denggbgma/image/upload/v1752125547/photo-1751895124321-ba5a53b16612_tzof6f.jpg",
    description: "Find freelance gigs.",
  },
];

export default function UniversityStudentsResources() {
  return (
    <AuthGuard>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-10 text-center">
          University Students Resources
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {universityResources.map(({ title, href, coverPhoto, description }) => (
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
