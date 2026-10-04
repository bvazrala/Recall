import { api } from "@/lib/api";

// Server component: runs on the Next.js server, so the page needs the Mastra server running.
export default async function Dashboard() {
  const { message } = await api<{ message: string }>("/example");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-neutral-600">{message}</p>
    </main>
  );
}
