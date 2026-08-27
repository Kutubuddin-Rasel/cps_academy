import type { Core, Data } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Context } from "koa";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";

const { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } =
  errors;
const BLOG_UID = "api::blog-post.blog-post";
type PostField = "title" | "content" | "coverUrl" | "publishedAt";
type BlogPost = Data.ContentType<typeof BLOG_UID, PostField>;
const POST_FIELDS: PostField[] = ["title", "content", "coverUrl", "publishedAt"];

function requireBlogWriter(ctx: Context) {
  const user = getAuthenticatedLmsUser(ctx.state.user);

  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (
    user.roleName !== LMS_ROLES.ADMIN &&
    user.roleName !== LMS_ROLES.CONTENT_MANAGER
  ) {
    throw new ForbiddenError(
      "Only Admin and Content Manager can manage Blog posts.",
    );
  }

  return user;
}

function getDocumentId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new NotFoundError("Blog post not found.");
  }

  return value;
}

function checkBlockObjects(nodes: unknown[]): void {
  for (const node of nodes) {
    // Strapi's Blocks validator reads node.type, so reject null nodes first.
    if (!isUnknownRecord(node)) {
      throw new ValidationError("Blog content must contain Blocks objects.");
    }
    if (Array.isArray(node.children)) {
      checkBlockObjects(node.children);
    }
  }
}

function getWritableData(body: unknown, creating: boolean) {
  if (
    !isUnknownRecord(body) ||
    Object.keys(body).some((field) => field !== "data") ||
    !isUnknownRecord(body.data)
  ) {
    throw new ValidationError(
      'The request body must contain only a "data" object.',
    );
  }

  const input = body.data;
  if (
    Object.keys(input).some(
      (field) => !["title", "content", "coverUrl"].includes(field),
    )
  ) {
    throw new ValidationError("Only title, content, and coverUrl can be written.");
  }

  const data: Record<string, unknown> = {};
  if (creating || Object.prototype.hasOwnProperty.call(input, "title")) {
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      throw new ValidationError("Blog title must be a non-empty string.");
    }
    data.title = input.title;
  }

  if (creating || Object.prototype.hasOwnProperty.call(input, "content")) {
    if (!Array.isArray(input.content)) {
      throw new ValidationError("Blog content must be a Blocks array.");
    }
    checkBlockObjects(input.content);
    data.content = input.content;
  }

  if (Object.prototype.hasOwnProperty.call(input, "coverUrl")) {
    data.coverUrl = input.coverUrl;
  }

  return data;
}

function requireEmptyBody(body: unknown): void {
  if (body === undefined || body === null) {
    return;
  }
  if (!isUnknownRecord(body) || Object.keys(body).length > 0) {
    throw new ValidationError("This action does not accept a request body.");
  }
}

function postResponse(post: BlogPost) {
  return {
    documentId: post.documentId,
    title: post.title,
    content: post.content,
    coverUrl: post.coverUrl ?? null,
    publishedAt: post.publishedAt ?? null,
  };
}

async function requireBlogOwner(
  strapi: Core.Strapi,
  user: NonNullable<ReturnType<typeof requireBlogWriter>>,
  documentId: string,
) {
  if (user.roleName === LMS_ROLES.ADMIN) {
    return;
  }

  const post = await strapi.documents(BLOG_UID).findOne({
    documentId,
    status: "draft",
    fields: ["documentId"],
    populate: { author: { fields: ["id"] } },
  });

  if (!post) {
    throw new NotFoundError("Blog post not found.");
  }

  if (post.author?.id !== user.id) {
    throw new ForbiddenError("Content Managers can only manage their own Blog posts.");
  }
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async create(ctx: Context) {
    const user = requireBlogWriter(ctx);
    const data = getWritableData(ctx.request.body, true);
    // The core service forwards this allowlisted data to Document Service.
    const post = await strapi.service(BLOG_UID).create({
      status: "draft",
      data: { ...data, author: user.id },
      fields: POST_FIELDS,
    });

    ctx.status = 201;
    ctx.body = { data: { post: postResponse(post) } };
  },

  async update(ctx: Context) {
    const user = requireBlogWriter(ctx);
    const data = getWritableData(ctx.request.body, false);
    const documentId = getDocumentId(ctx.params.id);
    await requireBlogOwner(strapi, user, documentId);

    const existing = await strapi.documents(BLOG_UID).findOne({
      documentId,
      status: "draft",
      fields: ["documentId"],
    });
    if (!existing) {
      throw new NotFoundError("Blog post not found.");
    }

    // Native update edits the draft; publishing is a separate action.
    const post = await strapi.documents(BLOG_UID).update({
      documentId,
      data,
      fields: POST_FIELDS,
    });
    if (!post) {
      throw new NotFoundError("Blog post not found.");
    }

    ctx.body = { data: { post: postResponse(post) } };
  },

  async delete(ctx: Context) {
    const user = requireBlogWriter(ctx);
    requireEmptyBody(ctx.request.body);
    const documentId = getDocumentId(ctx.params.id);
    await requireBlogOwner(strapi, user, documentId);

    const result = await strapi.documents(BLOG_UID).delete({
      documentId,
    });
    if (result.entries.length === 0) {
      throw new NotFoundError("Blog post not found.");
    }

    ctx.status = 204;
  },

  async publish(ctx: Context) {
    const user = requireBlogWriter(ctx);
    requireEmptyBody(ctx.request.body);
    const documentId = getDocumentId(ctx.params.documentId);
    await requireBlogOwner(strapi, user, documentId);

    const result = await strapi.documents(BLOG_UID).publish({
      documentId,
    });
    const post = result.entries[0];
    if (!post) {
      throw new NotFoundError("Blog post not found.");
    }

    ctx.body = { data: { post: postResponse(post) } };
  },

  async unpublish(ctx: Context) {
    const user = requireBlogWriter(ctx);
    requireEmptyBody(ctx.request.body);
    const documentId = getDocumentId(ctx.params.documentId);
    await requireBlogOwner(strapi, user, documentId);

    const draft = await strapi.documents(BLOG_UID).findOne({
      documentId,
      status: "draft",
      fields: POST_FIELDS,
    });
    if (!draft) {
      throw new NotFoundError("Blog post not found.");
    }
    await strapi.documents(BLOG_UID).unpublish({ documentId });

    ctx.body = { data: { post: postResponse(draft) } };
  },

  async find(ctx: Context) {
    const posts = await strapi.documents(BLOG_UID).findMany({
      status: "published",
      fields: POST_FIELDS,
      sort: [{ publishedAt: "desc" }, { id: "desc" }],
    });

    ctx.body = { data: { posts: posts.map(postResponse) } };
  },

  async findOne(ctx: Context) {
    const post = await strapi.documents(BLOG_UID).findOne({
      documentId: getDocumentId(ctx.params.documentId),
      status: "published",
      fields: POST_FIELDS,
    });
    if (!post) {
      throw new NotFoundError("Blog post not found.");
    }

    ctx.body = { data: { post: postResponse(post) } };
  },

  async manage(ctx: Context) {
    const user = requireBlogWriter(ctx);
    const filters = user.roleName === LMS_ROLES.CONTENT_MANAGER ? { author: { id: user.id } } : {};

    const [drafts, published] = await Promise.all([
      strapi.documents(BLOG_UID).findMany({ filters, status: "draft", fields: POST_FIELDS }),
      strapi.documents(BLOG_UID).findMany({ filters, status: "published", fields: POST_FIELDS }),
    ]);
    const publishedById = new Map(published.map((post) => [post.documentId, post]));
    // One editable row per document, with the state of its live version.
    const byDocumentId = new Map(
      [...published, ...drafts].map((post) => [post.documentId, post]),
    );
    const posts = [...byDocumentId.values()]
      .map((post) => {
        const live = publishedById.get(post.documentId);
        return {
          ...postResponse(post),
          publicationState: live ? "published" : "draft",
          publishedAt: live?.publishedAt ?? null,
        };
      })
      .sort((a, b) => a.documentId.localeCompare(b.documentId));

    ctx.body = { data: { posts } };
  },
});
