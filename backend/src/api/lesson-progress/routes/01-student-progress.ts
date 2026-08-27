export default {
  type: "content-api",
  routes: [
    {
      method: "POST",
      path: "/lessons/:lessonDocumentId/complete",
      handler: "lesson-progress.complete",
    },
    {
      method: "GET",
      path: "/courses/:courseDocumentId/progress",
      handler: "lesson-progress.courseProgress",
    },
    {
      method: "GET",
      path: "/courses/:courseDocumentId/lessons",
      handler: "lesson-progress.courseLessons",
    },
    {
      method: "GET",
      path: "/lessons/:lessonDocumentId/learn",
      handler: "lesson-progress.learnLesson",
    },
    {
      method: "GET",
      path: "/courses/:courseDocumentId/students-progress",
      handler: "lesson-progress.staffCourseProgress",
    },
  ],
};
