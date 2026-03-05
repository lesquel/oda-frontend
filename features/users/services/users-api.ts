import { apiClient } from '@/features/auth/services/auth-api';
import type { UserDTO } from '@/features/auth/types/auth-dto';
import { mapUserDTO } from '@/features/auth/mappers/auth-mapper';

export interface UpdateProfileRequest {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  avatarUrl?: string;
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

function mapPublicUser(dto: UserDTO): PublicUserProfile {
  const user = mapUserDTO(dto);
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    website: user.website,
    instagram: user.instagram,
    twitter: user.twitter,
    created_at: user.created_at,
  };
}

export interface UserStats {
  poem_count: number;
  published_count: number;
  draft_count: number;
  total_likes: number;
  total_views: number;
  total_bookmarks: number;
  emotion_distribution?: Record<string, number>;
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
    const payload = {
      username: data.username ?? data.name,
      bio: data.bio ?? '',
      avatar_url: data.avatarUrl ?? data.avatar ?? '',
      website: data.website ?? '',
      instagram: data.instagram ?? '',
      twitter: data.twitter ?? '',
    };
    const response = await apiClient.put<UserDTO>('/auth/profile', payload);
    return mapUserDTO(response.data);
  },

  /**
   * Get a public user profile by username
   */
  async getPublicProfile(username: string): Promise<PublicUserProfile> {
    const response = await apiClient.get<UserDTO>(
      `/users/${username}`
    );
    return mapPublicUser(response.data);
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
    if (!userId) {
      return [] as any[];
    }
    const params = status ? { status } : {};
    const response = await apiClient.get(`/users/${userId}/poems`, { params });
    return response.data as any[];
  },

  /**
   * Change the authenticated user's password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.post('/auth/change-password', {
      old_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};
