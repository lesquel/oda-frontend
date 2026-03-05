export interface PoemAuthorDTO {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  avatar_url?: string;
}

export interface PoemDTO {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author?: PoemAuthorDTO;
  status: 'draft' | 'published';
  likes_count?: number | string;
  like_count?: number | string;
  views_count?: number | string;
  view_count?: number | string;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  user_emotion?: string;
  emotion_counts?: Record<string, number>;
}
