/**
 * lesson router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::lesson.lesson", {
  config: {
    update: {
      policies: ["api::lesson.is-lesson-course-owner"],
    },
    delete: {
      policies: ["api::lesson.is-lesson-course-owner"],
    },
  },
});
