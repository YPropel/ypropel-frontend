import React, { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";

type MiniCourse = {
  id: number;
  title: string;
  description: string | null;
  brief?: string | null;
  cover_photo_url?: string;
  content_url?: string; // HTML content string
};

export default function MiniCoursesPage() {
  const [courses, setCourses] = useState<MiniCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<MiniCourse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("http://localhost:4000/mini-courses");
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  async function openCourseDetail(id: number) {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await fetch(`http://localhost:4000/mini-courses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch course details");
      const data = await res.json();
      setSelectedCourse(data);
    } catch (err: any) {
      setDetailError(err.message || "Unknown error");
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeModal() {
    setSelectedCourse(null);
    setDetailError(null);
  }

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Mini Courses</h1>

        <div className="divide-y divide-gray-300">
          {courses.map((course) => (
            <div
              key={course.id}
              className="cursor-pointer py-6"
              onClick={() => openCourseDetail(course.id)}
            >
              {course.cover_photo_url ? (
                <img
                  src={
                    course.cover_photo_url.startsWith("http")
                      ? course.cover_photo_url
                      : `http://localhost:4000${course.cover_photo_url}`
                  }
                  alt={course.title}
                  className="w-full h-56 object-cover rounded mb-4"
                />
              ) : (
                <div className="w-full h-56 bg-gray-200 flex items-center justify-center rounded mb-4">
                  <span className="text-gray-500 text-sm">No image</span>
                </div>
              )}

              <h2 className="text-2xl font-semibold mb-2">{course.title}</h2>
              <p className="text-gray-700 whitespace-pre-line mb-4">
                {course.brief || course.description || "No brief available."}
              </p>

              <button
                onClick={() => openCourseDetail(course.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                aria-label={`Access course: ${course.title}`}
              >
                Access Course
              </button>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selectedCourse && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                onClick={closeModal}
                aria-label="Close course details"
              >
                &times;
              </button>

              {loadingDetail ? (
                <p>Loading course details...</p>
              ) : detailError ? (
                <p className="text-red-600">Error: {detailError}</p>
              ) : (
                <>
                  {selectedCourse.cover_photo_url && (
                    <img
                      src={
                        selectedCourse.cover_photo_url.startsWith("http")
                          ? selectedCourse.cover_photo_url
                          : `http://localhost:4000${selectedCourse.cover_photo_url}`
                      }
                      alt={selectedCourse.title}
                      className="w-full h-64 object-cover rounded mb-4"
                    />
                  )}

                  <h2 className="text-2xl font-bold mb-4">{selectedCourse.title}</h2>

                  {(selectedCourse.content_url && selectedCourse.content_url.trim() !== "") ? (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedCourse.content_url }}
                    />
                  ) : selectedCourse.description ? (
                    <p className="whitespace-pre-line">{selectedCourse.description}</p>
                  ) : (
                    <p>No content available.</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
