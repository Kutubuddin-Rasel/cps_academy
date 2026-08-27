export default {
  type: "content-api",
  routes: [
    {
      method: "GET",
      path: "/admin/users",
      handler: "application-admin.users",
    },
    {
      method: "PATCH",
      path: "/admin/users/:userId/role",
      handler: "application-admin.changeRole",
    },
    {
      method: "GET",
      path: "/admin/stats",
      handler: "application-admin.stats",
    },
  ],
};
