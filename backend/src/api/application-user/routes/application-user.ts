export default {
  routes: [
    {
      method: "GET",
      path: "/me",
      handler: "application-user.me",
    },
    {
      method: "GET",
      path: "/instructors",
      handler: "application-user.instructors",
    },
  ],
};
