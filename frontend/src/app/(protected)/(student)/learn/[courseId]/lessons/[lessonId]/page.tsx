import type { Metadata } from "next";
import { LessonScreen } from "@/features/learning/lesson-screen";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = await params;
  return <LessonScreen key={`${courseId}:${lessonId}`} courseId={courseId} lessonId={lessonId} />;
}
