import type { Core, Data } from "@strapi/strapi";
import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Knex } from "knex";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";

const { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } =
  errors;
const COURSE_UID = "api::course.course";
const ENROLLMENT_UID = "api::enrollment.enrollment";

type EnrollmentWithCourse = {
  documentId: string;
  course?: {
    documentId: string;
    title?: string | null;
    description?: string | null;
  } | null;
};

function getStudentUser(value: unknown) {
  const user = getAuthenticatedLmsUser(value);

  if (!user) {
    throw new UnauthorizedError("Authentication required.");
  }

  if (user.roleName !== LMS_ROLES.STUDENT) {
    throw new ForbiddenError("Only Students may manage their enrollments.");
  }

  return user;
}

function getCourseDocumentId(params: unknown): string {
  if (
    !isUnknownRecord(params) ||
    typeof params.courseDocumentId !== "string" ||
    params.courseDocumentId.trim().length === 0
  ) {
    throw new NotFoundError("Course not found.");
  }

  return params.courseDocumentId;
}

function rejectClientEnrollmentRelations(body: unknown): void {
  if (!isUnknownRecord(body)) {
    return;
  }

  const data = isUnknownRecord(body.data) ? body.data : undefined;
  const hasClientRelation =
    Object.prototype.hasOwnProperty.call(body, "student") ||
    Object.prototype.hasOwnProperty.call(body, "course") ||
    (data !== undefined &&
      (Object.prototype.hasOwnProperty.call(data, "student") ||
        Object.prototype.hasOwnProperty.call(data, "course")));

  if (hasClientRelation) {
    throw new ValidationError(
      "Enrollment student and course are controlled by the server.",
    );
  }
}

async function findStudentCourseEnrollment(
  strapi: Core.Strapi,
  studentId: Data.ID,
  courseDocumentId: string,
) {
  return strapi.documents(ENROLLMENT_UID).findFirst({
    filters: {
      student: { id: studentId },
      course: { documentId: courseDocumentId },
    },
    fields: ["documentId"],
    populate: {
      course: {
        fields: ["documentId", "title", "description"],
      },
    },
  });
}

function getEnrollmentResponse(enrollment: EnrollmentWithCourse) {
  if (
    !enrollment.course ||
    typeof enrollment.course.documentId !== "string" ||
    typeof enrollment.course.title !== "string"
  ) {
    return undefined;
  }

  return {
    documentId: enrollment.documentId,
    course: {
      documentId: enrollment.course.documentId,
      title: enrollment.course.title,
      description: enrollment.course.description ?? null,
    },
  };
}

async function lockStudentForUpdate(
  transaction: Knex.Transaction,
  studentId: Data.ID,
): Promise<void> {
  const student: unknown = await transaction("up_users")
    .select("id")
    .where({ id: studentId })
    .forUpdate()
    .first();

  if (!isUnknownRecord(student)) {
    throw new UnauthorizedError("Authentication required.");
  }
}

async function lockCourseForKeyShare(
  transaction: Knex.Transaction,
  documentId: string,
): Promise<void> {
  const course: unknown = await transaction("courses")
    .select("id")
    .where({ document_id: documentId })
    .forKeyShare()
    .first();

  if (!isUnknownRecord(course)) {
    throw new NotFoundError("Course not found.");
  }
}

export default factories.createCoreController(
  ENROLLMENT_UID,
  ({ strapi }) => ({
    async enroll(ctx) {
      const user = getStudentUser(ctx.state.user);

      rejectClientEnrollmentRelations(ctx.request.body);

      const courseDocumentId = getCourseDocumentId(ctx.params);
      const result = await strapi.db.transaction(
        async ({ trx }: { trx: Knex.Transaction }) => {
          await lockStudentForUpdate(trx, user.id);
          await lockCourseForKeyShare(trx, courseDocumentId);

          const course = await strapi.documents(COURSE_UID).findOne({
            documentId: courseDocumentId,
            fields: ["documentId"],
          });

          if (!course) {
            throw new NotFoundError("Course not found.");
          }

          const existingEnrollment = await findStudentCourseEnrollment(
            strapi,
            user.id,
            course.documentId,
          );

          if (existingEnrollment) {
            return {
              enrollment: existingEnrollment,
              alreadyEnrolled: true,
            };
          }

          const enrollment = await strapi.documents(ENROLLMENT_UID).create({
            data: {
              student: user.id,
              course: { documentId: course.documentId },
            },
            fields: ["documentId"],
            populate: {
              course: {
                fields: ["documentId", "title", "description"],
              },
            },
          });

          return { enrollment, alreadyEnrolled: false };
        },
      );
      const responseData = getEnrollmentResponse(result.enrollment);

      if (!responseData) {
        throw new NotFoundError("Course not found.");
      }

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error(
          "Enrollment controller response helpers are unavailable.",
        );
      }

      const sanitizedEnrollment = await this.sanitizeOutput(responseData, ctx);

      ctx.status = result.alreadyEnrolled ? 200 : 201;
      return this.transformResponse(sanitizedEnrollment, {
        alreadyEnrolled: result.alreadyEnrolled,
      });
    },

    async me(ctx) {
      const user = getStudentUser(ctx.state.user);
      const enrollments = await strapi.documents(ENROLLMENT_UID).findMany({
        filters: { student: { id: user.id } },
        fields: ["documentId"],
        populate: {
          course: {
            fields: ["documentId", "title", "description"],
          },
        },
        sort: ["createdAt:desc"],
      });
      const responseData = [];

      for (const enrollment of enrollments) {
        const response = getEnrollmentResponse(enrollment);

        if (!response) {
          strapi.log.warn(
            `Skipping Enrollment "${enrollment.documentId}" because its Course relation is unavailable.`,
          );
          continue;
        }

        responseData.push(response);
      }

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error(
          "Enrollment controller response helpers are unavailable.",
        );
      }

      const sanitizedEnrollments = await this.sanitizeOutput(responseData, ctx);

      return this.transformResponse(sanitizedEnrollments);
    },
  }),
);
