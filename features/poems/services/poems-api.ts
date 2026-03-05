import { apiClient } from '../../auth/services/auth-api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Poem,
  PoemResponse,
  PublicUserProfile,
  CreatePoemRequest,
  UpdatePoemRequest,
  EmotionType,
  PoemStatus
} from '../types/poem';
import type { PoemDTO } from '../types/poem-dto';
import { mapPoemDTO, mapPoemDTOList, type PoemInteractionState } from '../mappers/poem-mapper';

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

const INTERACTIONS_CACHE_KEY = 'poem_interactions_cache_v1';

let interactionsCache: Record<string, PoemInteractionState> = {};
let cacheLoaded = false;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function ensureInteractionsLoaded() {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(INTERACTIONS_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      interactionsCache = parsed as Record<string, PoemInteractionState>;
    }
  } catch {
    interactionsCache = {};
  }
}

async function persistInteractions() {
  try {
    await AsyncStorage.setItem(INTERACTIONS_CACHE_KEY, JSON.stringify(interactionsCache));
  } catch {
    // best effort cache
  }
}

async function resolveEmotionId(emotionRef: string): Promise<string> {
  const trimmed = emotionRef.trim();
  if (!trimmed) {
    throw new Error('Emotion ID is required');
  }
  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  const response = await apiClient.get<EmotionCatalogEntry[]>('/emotions');
  const normalized = trimmed.toLowerCase();
  const matched = response.data.find((emotion) => {
    const values = [emotion.id, emotion.slug, emotion.name, emotion.label]
      .filter(Boolean)
      .map((value) => value!.toLowerCase());
    return values.includes(normalized);
  });

  if (!matched?.id) {
    throw new Error('Emotion not found in catalog');
  }

  return matched.id;
}

export const poemsApi = {
  /**
   * Get paginated feed of poems
   */
  getFeed: async (params?: GetFeedParams): Promise<PoemResponse[]> => {
    await ensureInteractionsLoaded();
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    const url = `/poems/feed${query ? `?${query}` : ''}`;
    
    const response = await apiClient.get<PoemDTO[]>(url);
    return mapPoemDTOList(response.data, interactionsCache);
  },

  /**
   * Get a single poem by ID
   */
  getPoemById: async (poemId: string): Promise<PoemResponse> => {
    await ensureInteractionsLoaded();
    const response = await apiClient.get<PoemDTO>(`/poems/${poemId}`);
    return mapPoemDTO(response.data, interactionsCache[poemId]);
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
    await ensureInteractionsLoaded();
    const response = await apiClient.post<ToggleLikeResponse>(`/poems/${poemId}/like`);
    interactionsCache[poemId] = {
      ...(interactionsCache[poemId] ?? {}),
      is_liked: response.data.is_liked,
    };
    await persistInteractions();
    return response.data.is_liked;
  },

  /**
   * Tag an emotion on a poem
   */
  tagEmotion: async (poemId: string, emotionId: string): Promise<void> => {
    const resolvedEmotionId = await resolveEmotionId(emotionId);
    await apiClient.post(`/poems/${poemId}/emotions`, { emotion_id: resolvedEmotionId });
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
    await ensureInteractionsLoaded();
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    const url = `/users/${params.userId}/poems${query ? `?${query}` : ''}`;
    
    const response = await apiClient.get<PoemDTO[]>(url);
    return mapPoemDTOList(response.data, interactionsCache);
  },

  /**
   * Search poems by query and/or emotion
   */
  searchPoems: async (q: string, emotion?: string, limit?: number): Promise<PoemResponse[]> => {
    await ensureInteractionsLoaded();
    const params = new URLSearchParams({ q });
    if (emotion) params.append('emotion', emotion);
    if (limit) params.append('limit', limit.toString());
    const response = await apiClient.get<PoemDTO[]>(`/poems/search?${params}`);
    return mapPoemDTOList(response.data, interactionsCache);
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
    await ensureInteractionsLoaded();
    const response = await apiClient.post<{ bookmarked: boolean }>(`/poems/${poemId}/bookmark`);
    interactionsCache[poemId] = {
      ...(interactionsCache[poemId] ?? {}),
      is_bookmarked: response.data.bookmarked,
    };
    await persistInteractions();
    return response.data.bookmarked;
  },

  /**
   * Get current user's bookmarked poems
   */
  getUserBookmarks: async (): Promise<PoemResponse[]> => {
    await ensureInteractionsLoaded();
    const response = await apiClient.get<PoemDTO[]>('/bookmarks');
    return mapPoemDTOList(response.data, interactionsCache);
  },

  /**
   * Get the full emotion catalog from the backend
   */
  getEmotionCatalog: async (): Promise<EmotionCatalogEntry[]> => {
    const response = await apiClient.get<EmotionCatalogEntry[]>('/emotions');
    return response.data;
  },
};
