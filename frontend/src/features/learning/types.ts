export interface CourseLesson {
  documentId: string;
  title: string;
  order: number;
  completed: boolean;
  locked: boolean;
}

export interface Lesson {
  documentId: string;
  title: string;
  order: number;
  completed: boolean;
  content: string | null;
  videoUrl: string | null;
}

export interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}
