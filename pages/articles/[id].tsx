import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        const res = await fetch(`http://localhost:4000/articles/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data);
        }
      } catch (err) {
        console.error("Failed to load article:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!article) return <p className="p-6">Article not found.</p>;

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
    </div>
  );
}
