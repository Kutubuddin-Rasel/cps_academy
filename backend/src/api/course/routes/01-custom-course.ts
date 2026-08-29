export default {
  routes: [
    {
      method: "GET",
      path: "/catalog/courses",
      handler: "course.catalog",
    },
    {
      method: "GET",
      path: "/catalog/courses/:courseDocumentId",
      handler: "course.catalogDetail",
    },
    {
      method: "GET",
      path: "/courses/manage",
      handler: "course.manageList",
    },
    {
      method: "GET",
      path: "/courses/:courseDocumentId/manage-content",
      handler: "course.manageContent",
    },
  ],
};
