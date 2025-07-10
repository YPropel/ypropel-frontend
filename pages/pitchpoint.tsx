import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient";

type Video = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  category: string | null;
  likes: number;
  follows: number;
  shares: number;
  likedByUser: boolean;
  followedByUser: boolean;
};

const categories = [
  "PitchPoint Video",
  "Career Tips",
  "Networking",
  "Productivity",
  "Skill Development",
  "Motivation",
];

export default function PitchPoint() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [token, setToken] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const [newVideo, setNewVideo] = useState<{
    title: string;
    description: string;
    category: string;
    url: string;
    file: File | null;
    isUploading: boolean;
  }>({
    title: "",
    description: "",
    category: categories[0],
    url: "",
    file: null,
    isUploading: false,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    setToken(storedToken);
    fetchVideos(storedToken);
  }, []);

  async function fetchVideos(token: string) {
    try {
      const res = await apiFetch("/api/videos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = await res.json();
      // Initialize likedByUser and followedByUser to false (you can enhance with real user data)
      const videosWithFlags = data.map((v: any) => ({
        ...v,
        likedByUser: false,
        followedByUser: false,
      }));
      setVideos(videosWithFlags);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  }

  // Handle input change for text fields & category dropdown
  function handleInputChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setNewVideo((prev) => ({ ...prev, [name]: value }));
  }

  // Handle file selection and upload to Cloudinary
  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setNewVideo((prev) => ({ ...prev, isUploading: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      setNewVideo((prev) => ({
        ...prev,
        file: file,
        url: data.videoUrl, // set the returned Cloudinary URL as video_url
        isUploading: false,
      }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload video. Please try again.");
      setNewVideo((prev) => ({ ...prev, file: null, url: "", isUploading: false }));
    }
  }

  // Submit new video pitch to backend
  async function handleAddVideo(e: FormEvent) {
    e.preventDefault();

    if (!newVideo.title.trim()) {
      alert("Please enter a video title.");
      return;
    }

    if (!newVideo.url.trim()) {
      alert("Please provide a YouTube embed URL or upload a video file.");
      return;
    }

    setNewVideo((prev) => ({ ...prev, isUploading: true }));

    try {
      const res = await apiFetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newVideo.title.trim(),
          description: newVideo.description.trim() || null,
          video_url: newVideo.url.trim(),
          category: newVideo.category,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add video");
      }

      // Refresh video list after successful add
      fetchVideos(token);

      // Reset form and close modal
      setNewVideo({
        title: "",
        description: "",
        category: categories[0],
        url: "",
        file: null,
        isUploading: false,
      });
      setShowForm(false);
    } catch (error: any) {
      console.error("Add video error:", error);
      alert(error.message || "Failed to add video. Please try again.");
      setNewVideo((prev) => ({ ...prev, isUploading: false }));
    }
  }

  // Helper to detect if video_url is an embed URL (YouTube) or direct video file URL
  function isEmbedUrl(url: string) {
    return url.includes("youtube.com/embed") || url.includes("youtu.be");
  }

  // Likes, follows, shares toggles copied from your current code, unchanged
  async function toggleLike(videoId: number, liked: boolean) {
    try {
      const res = await apiFetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ liked: !liked }),
      });
      const data = await res.json();
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? { ...video, likes: data.likes, likedByUser: data.likedByUser }
            : video
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  }

  async function toggleFollow(videoId: number, followed: boolean) {
    try {
      const res = await apiFetch(`/api/videos/${videoId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followed: !followed }),
      });
      const data = await res.json();
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? { ...video, follows: data.follows, followedByUser: data.followedByUser }
            : video
        )
      );
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  }

  async function handleShare(videoId: number) {
    try {
      const res = await apiFetch(`/api/videos/${videoId}/share`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId ? { ...video, shares: data.shares } : video
        )
      );
      alert("Thanks for sharing!");
    } catch (error) {
      console.error("Error sharing video:", error);
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-900">PitchPoint Video Hub</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
          >
            Add New Video
          </button>
        </div>

        {/* Add Video Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
            <form
              onSubmit={handleAddVideo}
              className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4 overflow-auto max-h-[90vh]"
            >
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Add New Video</h2>

              <label className="block">
                <span className="text-gray-700 font-semibold">Video Title *</span>
                <input
                  type="text"
                  name="title"
                  value={newVideo.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter video title"
                />
              </label>

              <label className="block">
                <span className="text-gray-700 font-semibold">Description (optional)</span>
                <textarea
                  name="description"
                  value={newVideo.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter video description"
                />
              </label>

              <label className="block">
                <span className="text-gray-700 font-semibold">Category *</span>
                <select
                  name="category"
                  value={newVideo.category}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-gray-700 font-semibold">YouTube Embed URL (if any)</span>
                <input
                  type="url"
                  name="url"
                  value={newVideo.url}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/embed/..."
                  disabled={newVideo.file !== null || newVideo.isUploading}
                  className={`mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    newVideo.file !== null || newVideo.isUploading ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </label>

              <label className="block">
                <span className="text-gray-700 font-semibold">Or Upload Video File</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={newVideo.url.trim() !== "" || newVideo.isUploading}
                  className={`mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    newVideo.url.trim() !== "" || newVideo.isUploading ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                {newVideo.isUploading && (
                  <p className="text-green-600 font-semibold mt-2">Uploading video, please wait...</p>
                )}
              </label>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                  disabled={newVideo.isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition ${
                    newVideo.isUploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={newVideo.isUploading}
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.length === 0 && (
            <p className="text-center text-gray-500 col-span-2">No videos available.</p>
          )}
          {videos.map(
            ({
              id,
              title,
              description,
              category,
              video_url,
              likes,
              follows,
              shares,
              likedByUser,
              followedByUser,
            }) => (
              <div
                key={id}
                className="bg-white rounded shadow p-4 flex flex-col items-center"
              >
                <div className="mb-1 text-sm text-blue-700 font-semibold">{category || "Uncategorized"}</div>
                <h2 className="text-xl font-semibold text-blue-900 mb-2 text-center">{title}</h2>
                {description && (
                  <p className="mb-3 text-center text-gray-700">{description}</p>
                )}

                <div className="w-full aspect-w-16 aspect-h-9 rounded overflow-hidden mb-4">
                  {isEmbedUrl(video_url) ? (
                    <iframe
                      src={video_url}
                      title={title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <video
                      src={video_url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex justify-center space-x-4 text-gray-700 w-full">
                  <button
                    onClick={() => toggleLike(id, likedByUser)}
                    className={`cursor-pointer px-4 py-1 rounded text-sm transition-colors ${
                      likedByUser
                        ? "bg-green-700 text-white"
                        : "bg-green-200 text-green-800 hover:bg-green-300"
                    }`}
                    aria-label={`Like video titled ${title}`}
                  >
                    👍 Like ({likes})
                  </button>
                  <button
                    onClick={() => toggleFollow(id, followedByUser)}
                    className={`cursor-pointer px-4 py-1 rounded text-sm transition-colors ${
                      followedByUser
                        ? "bg-green-700 text-white"
                        : "bg-green-200 text-green-800 hover:bg-green-300"
                    }`}
                    aria-label={`Follow video titled ${title}`}
                  >
                    ⭐ Follow ({follows})
                  </button>
                  <button
                    onClick={() => handleShare(id)}
                    className="cursor-pointer px-4 py-1 rounded text-sm bg-green-400 text-green-900 hover:bg-green-500 transition-colors"
                    aria-label={`Share video titled ${title}`}
                  >
                    🔄 Share ({shares})
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
