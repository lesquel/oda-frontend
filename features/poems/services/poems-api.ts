import { apiClient } from '../../auth/services/auth-api';
import type {
  Poem,
  PoemResponse,
  PublicUserProfile,
  CreatePoemRequest,
  UpdatePoemRequest,
  EmotionType,
  PoemStatus
} from '../types/poem';

export interface EmotionCatalogEntry {
  id: string;
  slug?: string;
  name?: string;
  label?: string;
  emoji: string;
  description: string;
  display_order?: number;
}

export interface GetFeedParams {
  cursor?: string;
  limit?: number;
}

export interface GetUserPoemsParams {
  userId: string;
  status?: PoemStatus;
}

export interface ToggleLikeResponse {
  is_liked: boolean;
}

export interface TagEmotionResponse {
  message: string;
  emotion: EmotionType;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizePoem<T extends Record<string, any>>(poem: T): T {
  const likes = poem.likes_count ?? poem.like_count;
  const views = poem.views_count ?? poem.view_count;

  return {
    ...poem,
    likes_count: toNumber(likes),
    views_count: toNumber(views),
    like_count: toNumber(likes),
    view_count: toNumber(views),
  };
}

function normalizePoems<T extends Record<string, any>>(poems: T[]): T[] {
  return poems.map((poem) => normalizePoem(poem));
}

export const poemsApi = {
  /**
   * Get paginated feed of poems
   */
  getFeed: async (params?: GetFeedParams): Promise<PoemResponse[]> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    const url = `/poems/feed${query ? `?${query}` : ''}`;
    
    const response = await apiClient.get<PoemResponse[]>(url);
    return normalizePoems(response.data);
  },

  /**
   * Get a single poem by ID
   */
  getPoemById: async (poemId: string): Promise<PoemResponse> => {
    const response = await apiClient.get<PoemResponse>(`/poems/${poemId}`);
    return normalizePoem(response.data);
  },

  /**
   * Create a new poem
   */
  createPoem: async (data: CreatePoemRequest): Promise<Poem> => {
    const response = await apiClient.post<Poem>('/poems', data);
    return response.data;
  },

  /**
   * Update an existing poem
   */
  updatePoem: async (poemId: string, data: UpdatePoemRequest): Promise<Poem> => {
    const response = await apiClient.put<Poem>(`/poems/${poemId}`, data);
    return response.data;
  },

  /**
   * Delete a poem
   */
  deletePoem: async (poemId: string): Promise<void> => {
    await apiClient.delete(`/poems/${poemId}`);
  },

  /**
   * Toggle like on a poem
   */
  toggleLike: async (poemId: string): Promise<boolean> => {
    const response = await apiClient.post<ToggleLikeResponse>(`/poems/${poemId}/like`);
    return response.data.is_liked;
  },

  /**
   * Tag an emotion on a poem
   */
  tagEmotion: async (poemId: string, emotionId: string): Promise<void> => {
    await apiClient.post(`/poems/${poemId}/emotions`, { emotion_id: emotionId });
  },

  /**
   * Remove emotion tag from a poem
   */
  removeEmotionTag: async (poemId: string): Promise<void> => {
    await apiClient.delete(`/poems/${poemId}/emotions`);
  },

  /**
   * Get poems by a specific user
   */
  getUserPoems: async (params: GetUserPoemsParams): Promise<Poem[]> => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    const url = `/users/${params.userId}/poems${query ? `?${query}` : ''}`;
    
    const response = await apiClient.get<Poem[]>(url);
    return normalizePoems(response.data);
  },

  /**
   * Search poems by query and/or emotion
   */
  searchPoems: async (q: string, emotion?: string, limit?: number): Promise<PoemResponse[]> => {
    const params = new URLSearchParams({ q });
    if (emotion) params.append('emotion', emotion);
    if (limit) params.append('limit', limit.toString());
    const response = await apiClient.get<PoemResponse[]>(`/poems/search?${params}`);
    return normalizePoems(response.data);
  },

  /**
   * Search users by query
   */
  searchUsers: async (q: string): Promise<PublicUserProfile[]> => {
    const response = await apiClient.get<PublicUserProfile[]>(`/users/search?q=${encodeURIComponent(q)}`);
    return response.data;
  },

  /**
   * Toggle bookmark on a poem — returns new bookmarked state
   */
  toggleBookmark: async (poemId: string): Promise<boolean> => {
    const response = await apiClient.post<{ bookmarked: boolean }>(`/poems/${poemId}/bookmark`);
    return response.data.bookmarked;
  },

  /**
   * Get current user's bookmarked poems
   */
  getUserBookmarks: async (): Promise<PoemResponse[]> => {
    const response = await apiClient.get<PoemResponse[]>('/bookmarks');
    return normalizePoems(response.data);
  },

  /**
   * Get the full emotion catalog from the backend
   */
  getEmotionCatalog: async (): Promise<EmotionCatalogEntry[]> => {
    const response = await apiClient.get<EmotionCatalogEntry[]>('/emotions');
    return response.data;
  },
};
