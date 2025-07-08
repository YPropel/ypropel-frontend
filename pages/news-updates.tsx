import React, { useState, useEffect } from "react";
import AuthGuard from "../components/AuthGuard";
type NewsPost = {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
};

export default function NewsUpdates() {
  const [posts, setPosts] = useState<NewsPost[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("http://localhost:4000/news");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch news", err);
      }
    };

    fetchNews();
  }, []);

  return (
    <AuthGuard>
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Latest News & Updates</h1>

      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-gray-600">No news updates available at the moment.</p>
        ) : (
          posts.map(({ id, title, content, image_url, created_at }) => (
            <div key={id} className="border rounded p-4 shadow bg-white">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">{title}</h2>
              {image_url && (
                <img
                  src={image_url}
                  alt={title}
                  className="w-full max-h-64 object-cover rounded mb-3"
                />
              )}
              <p className="mb-2">{content}</p>
              <p className="text-sm text-gray-600">
                Posted on {new Date(created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
