// utils/apiClient.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, options);
}
