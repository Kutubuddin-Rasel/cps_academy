export interface BlogTextNode {
  type: "text";
  text: string;
}

export interface BlogParagraph {
  type: "paragraph";
  children: BlogTextNode[];
}

export interface BlogPost {
  documentId: string;
  title: string;
  content: BlogParagraph[];
  coverUrl: string | null;
  publishedAt: string | null;
}

export interface ManagedBlogPost extends BlogPost {
  publicationState: "draft" | "published";
}

export interface BlogEditorInput {
  title: string;
  body: string;
  coverUrl: string;
}
