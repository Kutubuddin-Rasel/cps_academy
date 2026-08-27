export default {
  routes: [
    {
      method: "GET",
      path: "/courses/:courseDocumentId/manage-content",
      handler: "course.manageContent",
    },
  ],
};
