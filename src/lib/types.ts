export interface BlogAuthorProfile {
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface BlogMetadata {
  id: number;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
  authorId?: number | null;
  authorUuid?: string | null;
  authorProfile?: BlogAuthorProfile | null;
}

export interface BlogContent {
  postId: number;
  content: string;
  format: string; // MARKDOWN
}

export interface CreateBlogRequest {
  title: string;
  markdown: string;
}

export interface UpdateBlogRequest {
  title: string;
  markdown: string;
}