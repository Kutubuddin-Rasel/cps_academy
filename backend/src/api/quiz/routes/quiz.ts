import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::quiz.quiz", {
  config: {
    update: {
      policies: ["api::quiz.is-quiz-course-owner"],
    },
    delete: {
      policies: ["api::quiz.is-quiz-course-owner"],
    },
  },
});
