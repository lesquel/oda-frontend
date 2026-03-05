import type { AuthResponseDTO, UserDTO } from '../types/auth-dto';
import type { AuthResponse, User } from '../services/auth-api';

export function mapUserDTO(dto: UserDTO): User {
  const twitter = dto.twitter ?? dto.x ?? '';
  return {
    id: dto.id,
    email: dto.email,
    username: dto.username,
    name: dto.username,
    bio: dto.bio ?? '',
    avatar: dto.avatar_url ?? '',
    avatar_url: dto.avatar_url ?? '',
    website: dto.website ?? '',
    instagram: dto.instagram ?? '',
    twitter,
    role: dto.role,
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  };
}

export function mapAuthResponseDTO(dto: AuthResponseDTO): AuthResponse {
  return {
    access_token: dto.access_token,
    refresh_token: dto.refresh_token,
    expires_in: dto.expires_in ?? 0,
    user: mapUserDTO(dto.user),
  };
}
