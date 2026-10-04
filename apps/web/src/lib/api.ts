const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4111";

// Thin wrapper for calling the Mastra server. Custom routes live at the server root (e.g. /status),
// Mastra's built-in endpoints under /api.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
