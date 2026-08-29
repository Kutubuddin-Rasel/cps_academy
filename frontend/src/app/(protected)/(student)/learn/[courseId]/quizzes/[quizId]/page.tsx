import type { Metadata } from "next";
import { QuizScreen } from "@/features/quizzes/quiz-screen";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage({ params }: { params: Promise<{ courseId: string; quizId: string }> }) {
  const { courseId, quizId } = await params;
  return <QuizScreen key={`${courseId}:${quizId}`} courseId={courseId} quizId={quizId} />;
}
