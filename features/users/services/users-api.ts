import { apiClient } from '@/features/auth/services/auth-api';

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  name: string;
  bio?: string;
  avatar?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  created_at: string;
}

export interface UserStats {
  poem_count: number;
  published_count: number;
  draft_count: number;
  total_likes: number;
  total_views: number;
}

/**
 * Users API Service
 * Handles user profile operations
 */
export const usersApi = {
  /**
   * Update the authenticated user's profile
   */
  async updateProfile(data: UpdateProfileRequest) {
    const response = await apiClient.put('/auth/me', data);
    return response.data;
  },

  /**
   * Get a public user profile by username
   */
  async getPublicProfile(username: string): Promise<PublicUserProfile> {
    const response = await apiClient.get<PublicUserProfile>(
      `/auth/users/${username}`
    );
    return response.data;
  },

  /**
   * Get poem stats for a given user ID
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const response = await apiClient.get<UserStats>(`/users/${userId}/stats`);
    return response.data;
  },

  /**
   * Get poems for a given author (optionally filtered by status)
   */
  async getUserPoems(userId: string, status?: 'published' | 'draft') {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/users/${userId}/poems`, { params });
    return response.data as any[];
  },
};
