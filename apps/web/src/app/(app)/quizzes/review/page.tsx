import { PastQuiz } from "@/screens/quizzes";

export default async function Page({ searchParams }: {
  searchParams: Promise<{ quiz?: string | string[] }>;
}) {
  const { quiz } = await searchParams;
  const quizId = typeof quiz === "string" ? quiz : "";
  return <PastQuiz key={quizId} quizId={quizId} />;
}
