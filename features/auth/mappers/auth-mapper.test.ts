import { mapUserDTO, mapAuthResponseDTO } from '../mappers/auth-mapper';
import type { AuthResponseDTO, UserDTO } from '../types/auth-dto';

describe('auth-mapper', () => {
  describe('mapUserDTO', () => {
    const baseDTO: UserDTO = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    it('should map basic user DTO correctly', () => {
      const result = mapUserDTO(baseDTO);

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(result.role).toBe('user');
    });

    it('should use username as name fallback', () => {
      const dtoWithoutName: UserDTO = {
        ...baseDTO,
      };
      // @ts-ignore - testing no name field
      delete dtoWithoutName.name;

      const result = mapUserDTO(dtoWithoutName);

      expect(result.name).toBe('testuser');
    });

    it('should handle twitter vs x field', () => {
      const dtoWithX: UserDTO = {
        ...baseDTO,
        x: '@twitterhandle',
      };

      const result = mapUserDTO(dtoWithX);

      expect(result.twitter).toBe('@twitterhandle');
    });

    it('should handle empty string for undefined fields', () => {
      const result = mapUserDTO(baseDTO);

      expect(result.bio).toBe('');
      expect(result.avatar).toBe('');
      expect(result.website).toBe('');
      expect(result.instagram).toBe('');
      expect(result.twitter).toBe('');
    });

    it('should map avatar_url to both avatar and avatar_url', () => {
      const dtoWithAvatar: UserDTO = {
        ...baseDTO,
        avatar_url: 'https://example.com/avatar.png',
      };

      const result = mapUserDTO(dtoWithAvatar);

      expect(result.avatar).toBe('https://example.com/avatar.png');
      expect(result.avatar_url).toBe('https://example.com/avatar.png');
    });

    it('should map optional fields when provided', () => {
      const dtoWithOptional: UserDTO = {
        ...baseDTO,
        bio: 'My bio',
        website: 'https://example.com',
        instagram: '@instagram',
        twitter: '@twitter',
        // Note: name field is not currently used by the mapper
        // it always falls back to username
      };

      const result = mapUserDTO(dtoWithOptional);

      expect(result.bio).toBe('My bio');
      expect(result.website).toBe('https://example.com');
      expect(result.instagram).toBe('@instagram');
      expect(result.twitter).toBe('@twitter');
      // The mapper always uses username as name fallback
      expect(result.name).toBe('testuser');
    });
  });

  describe('mapAuthResponseDTO', () => {
    const baseDTO: AuthResponseDTO = {
      access_token: 'access-token-123',
      refresh_token: 'refresh-token-456',
      expires_in: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    };

    it('should map auth response correctly', () => {
      const result = mapAuthResponseDTO(baseDTO);

      expect(result.access_token).toBe('access-token-123');
      expect(result.refresh_token).toBe('refresh-token-456');
      expect(result.expires_in).toBe(3600);
    });

    it('should map user inside response', () => {
      const result = mapAuthResponseDTO(baseDTO);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should default expires_in to 0 when not provided', () => {
      const dtoWithoutExpiry: AuthResponseDTO = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: baseDTO.user,
      };

      const result = mapAuthResponseDTO(dtoWithoutExpiry);

      expect(result.expires_in).toBe(0);
    });
  });
});
