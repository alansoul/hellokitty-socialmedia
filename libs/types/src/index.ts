// libs/types/src/index.ts

// ==========================================
// 1. USER TYPES
// ==========================================
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
}

// ==========================================
// 2. POST & MEDIA TYPES
// ==========================================
export type MediaType = 'TEXT' | 'IMAGE' | 'VIDEO';

export interface Post {
  id: string;
  authorId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: MediaType;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Optional relations (Populated when we join data)
  author?: User;
  comments?: Comment[];
}

// ==========================================
// 3. INTERACTION TYPES
// ==========================================
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  author?: User;
}

// ==========================================
// 4. API RESPONSE WRAPPERS
// ==========================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
