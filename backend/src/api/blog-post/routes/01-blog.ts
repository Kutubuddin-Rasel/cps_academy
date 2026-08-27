export default {
  type: "content-api",
  routes: [
    {
      method: "GET",
      path: "/blog/manage",
      handler: "blog-post.manage",
    },
    {
      method: "GET",
      path: "/blog",
      handler: "blog-post.find",
    },
    {
      method: "GET",
      path: "/blog/:documentId",
      handler: "blog-post.findOne",
    },
    {
      method: "POST",
      path: "/blog-posts/:documentId/publish",
      handler: "blog-post.publish",
    },
    {
      method: "POST",
      path: "/blog-posts/:documentId/unpublish",
      handler: "blog-post.unpublish",
    },
  ],
};
