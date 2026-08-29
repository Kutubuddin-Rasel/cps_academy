export interface ManagedCourse {
  documentId: string;
  title: string;
  description: string | null;
}

export interface Instructor {
  id: number;
  username: string;
}

export interface CourseInput {
  title: string;
  description: string | null;
  instructorId?: number;
}

export interface LessonInput {
  title: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
}

export interface ManagedLesson extends LessonInput {
  documentId: string;
}

export interface StaffQuizOption {
  optionKey: string;
  text: string;
}

export interface StaffQuizQuestion {
  questionKey: string;
  prompt: string;
  options: StaffQuizOption[];
  correctOptionKey: string;
}

export interface QuizInput {
  title: string;
  questions: StaffQuizQuestion[];
}

export interface ManagedQuiz extends QuizInput {
  documentId: string;
}

export interface ManagedContent {
  course: { documentId: string; title: string };
  lessons: ManagedLesson[];
  quizzes: ManagedQuiz[];
}

export interface CourseStudentProgress {
  course: { documentId: string };
  students: {
    student: { id: number; username: string };
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  }[];
}
