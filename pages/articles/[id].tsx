
'use client';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiFetch } from "../../apiClient"; // adjust path if needed




type Article = {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  published_at: string;
};

export default function ArticleDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;


  useEffect(() => {
    if (!id) return;

   const token = localStorage.getItem("token");

const fetchArticle = async () => {
  try {
    const res = await apiFetch(`/articles/${id}`);
    if (res.ok) {
      const data = await res.json();
      setArticle(data);
    }
    if (token) {
      const resLikes = await apiFetch(`/articles/${id}/likes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (resLikes.ok) {
        const likesData = await resLikes.json();
        setTotalLikes(likesData.totalLikes);
        setUserLiked(likesData.userLiked);
      }
    }
  } catch (err) {
    console.error("Failed to load article or likes:", err);
  } finally {
    setLoading(false);
  }
};



    fetchArticle();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!article) return <p className="p-6">Article not found.</p>;

//--------toggle like/unlike  button-----
  const toggleLike = async () => {
  if (!id) return;

  try {
    const method = userLiked ? "DELETE" : "POST";
    const res = await apiFetch(`/articles/${id}/like`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setUserLiked(!userLiked);
      setTotalLikes((count) => (userLiked ? count - 1 : count + 1));
    } else {
      alert("Failed to update like");
    }
  } catch {
    alert("Error updating like");
  }
};

//-------------
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {article.cover_image && (
        <img
          src={article.cover_image}
          alt={article.title}
          className="w-full h-64 object-cover rounded mb-6"
        />
      )}

      <h1 className="text-3xl font-bold text-blue-900 mb-2">{article.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        Published on {new Date(article.published_at).toLocaleDateString()}
      </p>

      <div
        className="prose max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br />") }}
      />
        {/* NEW: Like button */}
         <button
            onClick={toggleLike}
            className={`mt-6 px-4 py-2 rounded ${
              userLiked ? "bg-red-600 text-white" : "bg-gray-300 text-black"
             }`}
             >
             {userLiked ? "♥ Liked" : "♡ Like"} ({totalLikes})
          </button>

      </div>

    
  );
}
