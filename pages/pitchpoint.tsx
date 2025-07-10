import React, { useEffect, useState } from "react";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient"; 
type Video = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  likes: number;
  follows: number;
  shares: number;
  likedByUser: boolean;
  followedByUser: boolean;
};

export default function VideosList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [token, setToken] = useState<string>("");

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
      const data = await res.json();
      const videosWithFlags = data.map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        video_url: v.video_url,
        likes: v.likes || 0,
        follows: v.follows || 0,
        shares: v.shares || 0,
        likedByUser: false,
        followedByUser: false,
      }));
      setVideos(videosWithFlags);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  }

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
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Videos</h1>
      <div className="flex flex-col gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="border rounded p-4 shadow-sm w-full max-w-md mx-auto flex flex-col items-center"
          >
            <h2 className="text-xl font-semibold mb-2 text-center">{video.title}</h2>
            {video.description && (
              <p className="mb-3 text-center text-gray-700">{video.description}</p>
            )}
            <video
              src={video.video_url}
              controls
              className="w-80 h-auto rounded mb-4"
            />
            <div className="flex justify-center space-x-4 text-gray-700 w-full">
              <button
                onClick={() => toggleLike(video.id, video.likedByUser)}
                className={`cursor-pointer px-4 py-1 rounded text-sm transition-colors ${
                  video.likedByUser
                    ? "bg-green-700 text-white"
                    : "bg-green-200 text-green-800 hover:bg-green-300"
                }`}
              >
                👍 Like ({video.likes})
              </button>
              <button
                onClick={() => toggleFollow(video.id, video.followedByUser)}
                className={`cursor-pointer px-4 py-1 rounded text-sm transition-colors ${
                  video.followedByUser
                    ? "bg-green-700 text-white"
                    : "bg-green-200 text-green-800 hover:bg-green-300"
                }`}
              >
                ⭐ Follow ({video.follows})
              </button>
              <button
                onClick={() => handleShare(video.id)}
                className="cursor-pointer px-4 py-1 rounded text-sm bg-green-400 text-green-900 hover:bg-green-500 transition-colors"
              >
                🔄 Share ({video.shares})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </AuthGuard>
  );
}
