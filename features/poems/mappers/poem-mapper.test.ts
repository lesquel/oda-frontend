import { mapPoemDTO, mapPoemDTOList, type PoemInteractionState } from '../mappers/poem-mapper';
import type { PoemDTO } from '../types/poem-dto';

describe('poem-mapper', () => {
  describe('mapPoemDTO', () => {
    const baseDTO: PoemDTO = {
      id: 'poem-123',
      title: 'My Poem',
      content: 'Once upon a time...',
      likes_count: 10,
      views_count: 100,
      is_liked: false,
      is_bookmarked: false,
      author: {
        id: 'author-1',
        username: 'poet',
        name: 'The Poet',
        avatar_url: 'https://example.com/avatar.png',
      },
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should map basic DTO correctly', () => {
      const result = mapPoemDTO(baseDTO);

      expect(result.id).toBe('poem-123');
      expect(result.title).toBe('My Poem');
      expect(result.content).toBe('Once upon a time...');
      expect(result.likes_count).toBe(10);
      expect(result.views_count).toBe(100);
    });

    it('should handle likes_count vs like_count', () => {
      const dtoWithLikeCount = { ...baseDTO };
      // @ts-ignore - testing legacy field
      dtoWithLikeCount.like_count = 15;
      delete dtoWithLikeCount.likes_count;

      const result = mapPoemDTO(dtoWithLikeCount);

      expect(result.likes_count).toBe(15);
    });

    it('should handle views_count vs view_count', () => {
      const dtoWithViewCount = { ...baseDTO };
      // @ts-ignore - testing legacy field
      dtoWithViewCount.view_count = 200;
      delete dtoWithViewCount.views_count;

      const result = mapPoemDTO(dtoWithViewCount);

      expect(result.views_count).toBe(200);
    });

    it('should map author correctly with name fallback', () => {
      const dtoWithUsernameOnly = {
        ...baseDTO,
        author: {
          id: 'author-1',
          username: 'poet',
          // name not provided
        },
      };

      const result = mapPoemDTO(dtoWithUsernameOnly);

      expect(result.author?.name).toBe('poet');
    });

    it('should map author correctly with avatar fallback', () => {
      const dtoWithAvatar = {
        ...baseDTO,
        author: {
          id: 'author-1',
          username: 'poet',
          name: 'The Poet',
          avatar: 'https://example.com/avatar.png',
        },
      };

      const result = mapPoemDTO(dtoWithAvatar);

      expect(result.author?.avatar).toBe('https://example.com/avatar.png');
    });

    it('should use interaction state when provided', () => {
      const interaction: PoemInteractionState = {
        is_liked: true,
        is_bookmarked: true,
      };

      const result = mapPoemDTO(baseDTO, interaction);

      expect(result.is_liked).toBe(true);
      expect(result.is_bookmarked).toBe(true);
    });

    it('should fallback to DTO values when no interaction', () => {
      const dtoWithInteraction = {
        ...baseDTO,
        is_liked: true,
        is_bookmarked: true,
      };

      const result = mapPoemDTO(dtoWithInteraction);

      expect(result.is_liked).toBe(true);
      expect(result.is_bookmarked).toBe(true);
    });

    it('should default to false when no interaction and no DTO values', () => {
      const dtoWithoutInteraction: PoemDTO = {
        id: 'poem-123',
        title: 'My Poem',
        content: 'Once upon a time...',
      };

      const result = mapPoemDTO(dtoWithoutInteraction);

      expect(result.is_liked).toBe(false);
      expect(result.is_bookmarked).toBe(false);
    });

    it('should handle undefined author', () => {
      const dtoWithoutAuthor = {
        ...baseDTO,
      };
      delete dtoWithoutAuthor.author;

      const result = mapPoemDTO(dtoWithoutAuthor);

      expect(result.author).toBeUndefined();
    });
  });

  describe('mapPoemDTOList', () => {
    it('should map an array of DTOs', () => {
      const dtos: PoemDTO[] = [
        { id: 'poem-1', title: 'Poem 1', content: 'Content 1' },
        { id: 'poem-2', title: 'Poem 2', content: 'Content 2' },
      ];

      const result = mapPoemDTOList(dtos, {});

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('poem-1');
      expect(result[1].id).toBe('poem-2');
    });

    it('should apply interactions by poem ID', () => {
      const dtos: PoemDTO[] = [
        { id: 'poem-1', title: 'Poem 1', content: 'Content 1' },
        { id: 'poem-2', title: 'Poem 2', content: 'Content 2' },
      ];

      const interactions = {
        'poem-1': { is_liked: true, is_bookmarked: false },
      };

      const result = mapPoemDTOList(dtos, interactions);

      expect(result[0].is_liked).toBe(true);
      expect(result[1].is_liked).toBe(false);
    });

    it('should handle empty array', () => {
      const result = mapPoemDTOList([], {});

      expect(result).toHaveLength(0);
    });
  });

  describe('toNumber', () => {
    it('should return number as-is', () => {
      const dto: PoemDTO = {
        id: 'test',
        title: 'Test',
        content: 'Test',
        likes_count: 42,
      };
      const result = mapPoemDTO(dto);
      expect(result.likes_count).toBe(42);
    });

    it('should parse string numbers', () => {
      const dto: PoemDTO = {
        id: 'test',
        title: 'Test',
        content: 'Test',
        // @ts-ignore - testing string number
        likes_count: '123' as any,
      };
      const result = mapPoemDTO(dto);
      expect(result.likes_count).toBe(123);
    });

    it('should return 0 for invalid strings', () => {
      const dto: PoemDTO = {
        id: 'test',
        title: 'Test',
        content: 'Test',
        // @ts-ignore - testing invalid string
        likes_count: 'invalid' as any,
      };
      const result = mapPoemDTO(dto);
      expect(result.likes_count).toBe(0);
    });
  });
});
