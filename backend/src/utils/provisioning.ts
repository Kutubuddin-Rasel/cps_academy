import type { Core } from '@strapi/strapi';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const LMS_ROLES = [
  { name: 'Admin', type: 'admin', description: 'Administrator' },
  { name: 'Content Manager', type: 'content-manager', description: 'Content Manager' },
  { name: 'Instructor', type: 'instructor', description: 'Instructor' },
  { name: 'Student', type: 'student', description: 'Student' }
];

const PERMISSION_MATRIX: Record<string, string[]> = {
  'admin': [
    'api::application-admin.application-admin.changeRole',
    'api::application-admin.application-admin.stats',
    'api::application-admin.application-admin.users',
    'api::blog-post.blog-post.create',
    'api::blog-post.blog-post.delete',
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'api::blog-post.blog-post.manage',
    'api::blog-post.blog-post.publish',
    'api::blog-post.blog-post.unpublish',
    'api::blog-post.blog-post.update',
    'api::course.course.create',
    'api::course.course.delete',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::course.course.update',
    'api::course.course.manageContent',
    'api::enrollment.enrollment.find',
    'api::enrollment.enrollment.findOne',
    'api::lesson-progress.lesson-progress.staffCourseProgress',
    'api::lesson.lesson.create',
    'api::lesson.lesson.delete',
    'api::lesson.lesson.find',
    'api::lesson.lesson.findOne',
    'api::lesson.lesson.update',
    'api::quiz.quiz.create',
    'api::quiz.quiz.delete',
    'api::quiz.quiz.find',
    'api::quiz.quiz.findOne',
    'api::quiz.quiz.update',
    'plugin::users-permissions.user.me',
    'api::application-user.application-user.me',
    'api::application-user.application-user.instructors'
  ],
  'content-manager': [
    'api::blog-post.blog-post.create',
    'api::blog-post.blog-post.delete',
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'api::blog-post.blog-post.manage',
    'api::blog-post.blog-post.publish',
    'api::blog-post.blog-post.unpublish',
    'api::blog-post.blog-post.update',
    'api::course.course.create',
    'api::course.course.delete',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::course.course.update',
    'api::course.course.manageContent',
    'api::lesson-progress.lesson-progress.staffCourseProgress',
    'api::lesson.lesson.create',
    'api::lesson.lesson.delete',
    'api::lesson.lesson.find',
    'api::lesson.lesson.findOne',
    'api::lesson.lesson.update',
    'api::quiz.quiz.create',
    'api::quiz.quiz.delete',
    'api::quiz.quiz.find',
    'api::quiz.quiz.findOne',
    'api::quiz.quiz.update',
    'plugin::users-permissions.user.me',
    'api::application-user.application-user.me',
    'api::application-user.application-user.instructors'
  ],
  'instructor': [
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'api::course.course.create',
    'api::course.course.delete',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::course.course.update',
    'api::course.course.manageContent',
    'api::lesson-progress.lesson-progress.staffCourseProgress',
    'api::lesson.lesson.create',
    'api::lesson.lesson.delete',
    'api::lesson.lesson.update',
    'api::quiz.quiz.create',
    'api::quiz.quiz.delete',
    'api::quiz.quiz.update',
    'plugin::users-permissions.user.me',
    'api::application-user.application-user.me'
  ],
  'student': [
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'api::course.course.find',
    'api::course.course.findOne',
    'api::enrollment.enrollment.enroll',
    'api::enrollment.enrollment.me',
    'api::lesson-progress.lesson-progress.complete',
    'api::lesson-progress.lesson-progress.courseLessons',
    'api::lesson-progress.lesson-progress.courseProgress',
    'api::lesson-progress.lesson-progress.learnLesson',
    'api::quiz-attempt.quiz-attempt.courseQuizzes',
    'api::quiz-attempt.quiz-attempt.myAttempts',
    'api::quiz-attempt.quiz-attempt.submit',
    'api::quiz-attempt.quiz-attempt.take',
    'plugin::users-permissions.user.me',
    'api::application-user.application-user.me'
  ],
  'public': [
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'plugin::users-permissions.auth.callback',
    'plugin::users-permissions.auth.connect',
    'plugin::users-permissions.auth.emailConfirmation',
    'plugin::users-permissions.auth.forgotPassword',
    'plugin::users-permissions.auth.refresh',
    'plugin::users-permissions.auth.register',
    'plugin::users-permissions.auth.resetPassword',
    'plugin::users-permissions.auth.sendEmailConfirmation'
  ],
  'authenticated': [
    'api::blog-post.blog-post.find',
    'api::blog-post.blog-post.findOne',
    'plugin::users-permissions.auth.changePassword',
    'plugin::users-permissions.auth.getSessions',
    'plugin::users-permissions.auth.logout',
    'plugin::users-permissions.auth.revokeSession',
    'plugin::users-permissions.user.me',
    'api::application-user.application-user.me'
  ]
};

export async function provisionRolesAndPermissions(strapi: Core.Strapi) {
  // 1. Action Validation
  const actionsRegistry: unknown = await strapi.plugin('users-permissions').service('users-permissions').getActions();
  const flattenActions = (registry: unknown) => {
    const actions = new Set<string>();
    if (isRecord(registry)) {
      for (const [pluginName, pluginConfig] of Object.entries(registry)) {
        if (isRecord(pluginConfig) && isRecord(pluginConfig.controllers)) {
          for (const [controllerName, controllerConfig] of Object.entries(pluginConfig.controllers)) {
            if (isRecord(controllerConfig)) {
              for (const actionName of Object.keys(controllerConfig)) {
                actions.add(`${pluginName}.${controllerName}.${actionName}`);
              }
            }
          }
        }
      }
    }
    return actions;
  };
  
  const installedActions = flattenActions(actionsRegistry);
  
  for (const actions of Object.values(PERMISSION_MATRIX)) {
    for (const action of actions) {
      if (!installedActions.has(action)) {
        throw new Error(`Startup provisioning error: Missing expected action in registry: ${action}`);
      }
    }
  }

  // 2. Provision Roles
  for (const lmsRole of LMS_ROLES) {
    const existing = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: lmsRole.type }
    });
    if (!existing) {
      await strapi.db.query('plugin::users-permissions.role').create({
        data: lmsRole
      });
    }
  }

  // Reload all roles to get IDs
  const allRoles = await strapi.db.query('plugin::users-permissions.role').findMany({});
  const roleTypeMap = new Map();
  allRoles.forEach(r => roleTypeMap.set(r.type, r.id));

  // Assert expected roles exist
  for (const roleType of Object.keys(PERMISSION_MATRIX)) {
    if (!roleTypeMap.has(roleType)) {
      throw new Error(`Provisioning failed: Role type ${roleType} is missing in DB.`);
    }
  }

  // 3. Provision Permissions
  for (const [roleType, actions] of Object.entries(PERMISSION_MATRIX)) {
    const roleId = roleTypeMap.get(roleType);
    
    // Get existing permissions for this role
    const existingPermissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
      where: { role: roleId }
    });

    const existingActions = new Set(existingPermissions.map(p => p.action));
    const targetActions = new Set(actions);

    // Create missing permissions
    for (const action of targetActions) {
      if (!existingActions.has(action)) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: roleId }
        });
      }
    }

    // Delete removed permissions
    for (const p of existingPermissions) {
      if (!targetActions.has(p.action)) {
        await strapi.db.query('plugin::users-permissions.permission').delete({
          where: { id: p.id }
        });
      }
    }
  }

  // 4. Configure U&P Registration Default Role
  const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
  const advanced: unknown = await pluginStore.get();
  
  if (!isRecord(advanced)) {
    throw new Error('Provisioning failed: Users & Permissions advanced settings are missing or malformed.');
  }

  if (advanced.default_role !== 'student') {
    advanced.default_role = 'student';
    await pluginStore.set({ value: advanced });
  }
}
