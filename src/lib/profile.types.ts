export interface Profile {
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  preferences: Record<string, unknown>;
  socialLinks: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
