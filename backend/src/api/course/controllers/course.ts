import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import { getValidInstructorId } from "../utils/instructor";

const { ForbiddenError, NotFoundError, ValidationError } = errors;
const COURSE_UID = "api::course.course";

function canManageAllCourses(roleName: string): boolean {
  return roleName === LMS_ROLES.ADMIN || roleName === LMS_ROLES.CONTENT_MANAGER;
}

function canWriteCourses(roleName: string): boolean {
  return canManageAllCourses(roleName) || roleName === LMS_ROLES.INSTRUCTOR;
}

function getRequestData(body: unknown): Record<string, unknown> {
  if (!isUnknownRecord(body) || !isUnknownRecord(body.data)) {
    throw new ValidationError('Missing "data" payload in the request body');
  }

  return body.data;
}

function hasOwnField(data: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(data, field);
}

function getWritableCourseData(
  requestData: Record<string, unknown>,
): Record<string, unknown> {
  const writableData: Record<string, unknown> = {};

  if (hasOwnField(requestData, "title")) {
    writableData.title = requestData.title;
  }

  if (hasOwnField(requestData, "description")) {
    writableData.description = requestData.description;
  }

  return writableData;
}

function getCourseDocumentId(params: unknown): string {
  if (!isUnknownRecord(params) || typeof params.id !== "string") {
    throw new NotFoundError("Course not found");
  }

  return params.id;
}

export default factories.createCoreController(
  "api::course.course",
  ({ strapi }) => ({
    async create(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);

      if (!user) {
        return ctx.unauthorized();
      }

      if (!canWriteCourses(user.roleName)) {
        throw new ForbiddenError("You cannot create courses.");
      }

      const requestData = getRequestData(ctx.request.body);
      const data = getWritableCourseData(requestData);

      if (user.roleName === LMS_ROLES.INSTRUCTOR) {
        data.instructor = user.id;
      } else {
        data.instructor = await getValidInstructorId(
          strapi,
          requestData.instructor,
        );
      }

      const course = await strapi.service(COURSE_UID).create({ data });

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error("Course controller response helpers are unavailable");
      }

      const sanitizedCourse = await this.sanitizeOutput(course, ctx);

      ctx.status = 201;
      return this.transformResponse(sanitizedCourse);
    },

    async update(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);

      if (!user) {
        return ctx.unauthorized();
      }

      if (!canWriteCourses(user.roleName)) {
        throw new ForbiddenError("You cannot update courses.");
      }

      const requestData = getRequestData(ctx.request.body);
      const isChangingInstructor = hasOwnField(requestData, "instructor");

      if (user.roleName === LMS_ROLES.INSTRUCTOR && isChangingInstructor) {
        throw new ForbiddenError(
          "Instructors cannot reassign course ownership.",
        );
      }

      const data = getWritableCourseData(requestData);

      if (canManageAllCourses(user.roleName) && isChangingInstructor) {
        data.instructor = await getValidInstructorId(
          strapi,
          requestData.instructor,
        );
      }

      const course = await strapi.documents(COURSE_UID).update({
        documentId: getCourseDocumentId(ctx.params),
        data,
      });

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error("Course controller response helpers are unavailable");
      }

      const sanitizedCourse = await this.sanitizeOutput(course, ctx);

      return this.transformResponse(sanitizedCourse);
    },
  }),
);
