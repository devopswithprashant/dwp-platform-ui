export interface BlogMetadata {
  id: number;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

export interface BlogContent {
  postId: number;
  content: string;
  format: string; // MARKDOWN
}

export interface CreateBlogRequest {
  title: string;
  authorId: number;
  markdown: string;
}

export interface UpdateBlogRequest {
  title: string;
  markdown: string;
}