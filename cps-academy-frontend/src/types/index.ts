export interface Course {
  id: number;
  documentId: string;
  title: string;
  description: string | Array<{ type: string; children: Array<{ type: string; text: string }>}>;
  thumbnail?: {
    url: string;
  };
  allowedRoles: string[] | string;
  modules?: Module[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Module {
  id: number;
  documentId: string;
  title: string;
  description: string;
  order: number;
  classes?: Class[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Class {
  id: number;
  documentId: string;
  title: string;
  topics: string;
  videoUrl: string;
  duration: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: {
    name: string;
    type: string;
  };
}

export interface AuthResponse {
  jwt: string;
  user: User;
}
