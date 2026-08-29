import type { Metadata } from "next";
import { BlogManagement } from "@/features/blog/blog-management";

export const metadata: Metadata = { title: "Manage Blog" };

export default function ManageBlogPage() {
  return <BlogManagement />;
}
