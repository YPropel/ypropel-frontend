import React, { useEffect, useState } from "react";
import { apiFetch } from "../../apiClient";

type Product = {
  id: number;
  title: string;
  note?: string;
  price_text?: string;
  image_url: string;
  affiliate_url: string;
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await apiFetch(`/shop/products?category=dorm-essentials`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Dorm Essentials</h1>
        <p className="text-gray-600 mt-1">Practical picks for move-in — curated for students.</p>
      </header>

      {products.length === 0 ? (
        <p>No products yet. Check back soon!</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <article key={p.id} className="border rounded-xl bg-white overflow-hidden shadow-sm">
              <img
                src={p.image_url.replace("/upload/","/upload/c_fill,g_auto,w_600,h_600,f_auto,q_auto/")}
                alt={p.title}
                className="w-full h-56 object-cover"
                loading="lazy"
              />
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-blue-900">{p.title}</h2>
                {p.note && <p className="text-sm text-gray-700">{p.note}</p>}
                {p.price_text && <p className="text-xs text-gray-500">{p.price_text}</p>}
                <a
                  href={p.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  View on Amazon
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
