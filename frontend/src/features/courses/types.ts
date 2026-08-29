export interface CourseSummary {
  documentId: string;
  title: string;
  description: string | null;
}

export interface EnrollmentSummary {
  documentId: string;
  course: CourseSummary;
}

export interface PublicInstructor {
  username: string;
}

export interface PublicCourseSummary extends CourseSummary {
  instructor: PublicInstructor | null;
}

export interface SyllabusItem {
  order: number;
  title: string;
}

export interface PublicCourseDetail extends PublicCourseSummary {
  syllabus: SyllabusItem[];
}
