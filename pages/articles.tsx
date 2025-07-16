
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthGuard from "../components/AuthGuard";
import { apiFetch } from "../apiClient"; 

type Article = {
  id: number;
  title: string;
  cover_image?: string;
  content: string;
  total_likes?: number;  // to display likes
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await apiFetch("/articles");
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error("Failed to fetch articles:", err);
      }
    };

    fetchArticles();
  }, []);

  const getExcerpt = (htmlContent: string, maxLength = 120) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <AuthGuard>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">📚 Articles</h1>

      {articles.length === 0 ? (
        <p className="text-gray-500">No articles available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="border rounded shadow hover:shadow-lg cursor-pointer bg-white flex flex-col"
              onClick={() => router.push(`/articles/${article.id}`)}
            >
              {article.cover_image && (
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="w-full h-48 object-cover rounded-t"
                />
              )}
              <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">
                  {article.title}
                </h2>
                <p className="text-sm text-green-600 font-semibold mb-2">
                 ♥ Likes: {article.total_likes ?? 0}
                </p>
                <p className="text-gray-600 text-sm flex-grow">
                  {getExcerpt(article.content)}
                </p>
                <span className="mt-3 text-green-600 font-semibold text-sm">
                  Read More →
                </span>
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}

