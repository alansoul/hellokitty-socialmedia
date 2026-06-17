// libs/types/src/index.ts

export interface AuthUser {
  id: string; // Postgres UUID
  tenantId: string;
  email: string;
}

export interface SocialProfile {
  id: string; // Mongo ObjectId
  userId: string; // Links back to AuthUser.id
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO';

export interface Post {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: MediaType;
  authorId: string;
  author?: SocialProfile;
  createdAt: Date;
}
