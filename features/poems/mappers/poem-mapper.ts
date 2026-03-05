import type { PoemDTO } from '../types/poem-dto';
import type { PoemResponse } from '../types/poem';

export interface PoemInteractionState {
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function mapPoemDTO(dto: PoemDTO, interaction?: PoemInteractionState): PoemResponse {
  const likes = dto.likes_count ?? dto.like_count;
  const views = dto.views_count ?? dto.view_count;
  const author = dto.author
    ? {
        ...dto.author,
        name: dto.author.name ?? dto.author.username,
        avatar: dto.author.avatar ?? dto.author.avatar_url ?? '',
      }
    : undefined;

  return {
    ...dto,
    author,
    likes_count: toNumber(likes),
    views_count: toNumber(views),
    like_count: toNumber(likes),
    view_count: toNumber(views),
    is_liked: interaction?.is_liked ?? dto.is_liked ?? false,
    is_bookmarked: interaction?.is_bookmarked ?? dto.is_bookmarked ?? false,
  } as PoemResponse;
}

export function mapPoemDTOList(dtos: PoemDTO[], interactions: Record<string, PoemInteractionState>): PoemResponse[] {
  return dtos.map((dto) => mapPoemDTO(dto, interactions[dto.id]));
}
