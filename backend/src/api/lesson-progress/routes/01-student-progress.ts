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
  ],
};
