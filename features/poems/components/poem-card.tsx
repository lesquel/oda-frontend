import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import type { PoemResponse } from '../types/poem';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { Colors, Typography, Shadows, Spacing } from '@/constants/colors';

interface PoemCardProps {
  poem: PoemResponse;
  onLike?: (poemId: string) => void;
}

export function PoemCard({ poem, onLike }: PoemCardProps) {
  const { isAuthenticated } = useAuthStore();

  const navigateToDetail = () => router.push(`/poem/${poem.id}`);

  const handleLike = (e: any) => {
    e.stopPropagation();
    if (!isAuthenticated) { router.push('/login'); return; }
    onLike?.(poem.id);
  };

  // Show up to 4 lines of content (≈ 120 chars)
  const preview = poem.content.length > 120
    ? poem.content.substring(0, 120).split('\n').slice(0, 4).join('\n') + '…'
    : poem.content;

  const timeAgo = formatDistanceToNow(new Date(poem.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Pressable onPress={navigateToDetail} style={styles.card}>
      <View style={styles.inner}>
        {/* ── Title block ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {poem.title}
          </Text>
          <View style={styles.divider} />
        </View>

        {/* ── Verse preview ── */}
        <View style={styles.verseBlock}>
          <Text style={styles.verse}>{preview}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.timeLabel}>{timeAgo}</Text>
          <View style={styles.footerRight}>
            <Text style={styles.authorName}>{poem.author?.name}</Text>
            {/* Like – only shown when authenticated */}
            {isAuthenticated && (
              <Pressable onPress={handleLike} style={styles.likeBtn} hitSlop={8}>
                <Text style={styles.likeIcon}>{poem.is_liked ? '❤️' : '🤍'}</Text>
                <Text style={styles.likeCount}>{poem.like_count}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 3 / 4,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    ...Shadows.lift,
  },
  inner: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    width: '100%',
  },
  title: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  divider: {
    width: 32,
    height: 1,
    backgroundColor: Colors.pencil,
    opacity: 0.3,
    marginTop: 4,
  },
  verseBlock: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  verse: {
    fontFamily: Typography.fontFamily.bodyItalic,
    fontSize: 17,
    lineHeight: 17 * 1.8,
    color: Colors.ink,
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
  },
  timeLabel: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.pencil,
  },
  footerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  authorName: {
    fontFamily: Typography.fontFamily.uiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.ink,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeIcon: {
    fontSize: 12,
  },
  likeCount: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 10,
    color: Colors.pencil,
  },
});
