export type PoemStatus = 'draft' | 'published';

export type EmotionType = 
  | 'melancholic' 
  | 'hopeful' 
  | 'serene' 
  | 'passionate' 
  | 'nostalgic' 
  | 'inspiring';

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author?: User;
  status: PoemStatus;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface PoemResponse extends Poem {
  is_liked: boolean;
  is_bookmarked: boolean;
  user_emotion?: EmotionType;
  emotion_counts?: Record<EmotionType, number>;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
  created_at: string;
}

export interface CreatePoemRequest {
  title: string;
  content: string;
  status?: PoemStatus;
}

export interface UpdatePoemRequest {
  title?: string;
  content?: string;
  status?: PoemStatus;
}

export interface TagEmotionRequest {
  emotion: EmotionType;
}
