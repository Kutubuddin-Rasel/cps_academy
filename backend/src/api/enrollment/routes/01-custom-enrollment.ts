export default {
  type: "content-api",
  routes: [
    {
      method: "POST",
      path: "/courses/:courseDocumentId/enroll",
      handler: "enrollment.enroll",
    },
    {
      method: "GET",
      path: "/enrollments/me",
      handler: "enrollment.me",
    },
  ],
};
