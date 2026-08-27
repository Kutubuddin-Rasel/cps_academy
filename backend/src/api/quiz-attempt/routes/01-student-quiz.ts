export default {
  type: "content-api",
  routes: [
    {
      method: "GET",
      path: "/courses/:courseDocumentId/quizzes",
      handler: "quiz-attempt.courseQuizzes",
    },
    {
      method: "GET",
      path: "/quizzes/:quizDocumentId/take",
      handler: "quiz-attempt.take",
    },
    {
      method: "POST",
      path: "/quizzes/:quizDocumentId/submit",
      handler: "quiz-attempt.submit",
    },
    {
      method: "GET",
      path: "/quizzes/:quizDocumentId/attempts/me",
      handler: "quiz-attempt.myAttempts",
    },
  ],
};
