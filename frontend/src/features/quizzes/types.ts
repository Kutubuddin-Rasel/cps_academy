export interface QuizSummary {
  documentId: string;
  title: string;
}

export interface QuizOption {
  optionKey: string;
  text: string;
}

export interface QuizQuestion {
  questionKey: string;
  prompt: string;
  options: QuizOption[];
}

export interface StudentQuiz extends QuizSummary {
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  questionKey: string;
  selectedOptionKey: string;
}

export interface QuizResult {
  documentId: string;
  score: number;
  total: number;
  percentage: number;
}

export interface QuizAttempt extends QuizResult {
  createdAt: string;
}
