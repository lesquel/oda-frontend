import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, Share, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import type { PoemResponse } from '../types/poem';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { Typography, Shadows, Spacing } from '@/constants/colors';
import { useThemedColors } from '@/hooks/use-themed-colors';

interface PoemCardProps {
  poem: PoemResponse;
  onLike?: (poemId: string) => void;
  onBookmark?: (poemId: string) => void;
}

export function PoemCard({ poem, onLike, onBookmark }: PoemCardProps) {
  const { isAuthenticated } = useAuthStore();
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const navigateToDetail = () => router.push(`/poem/${poem.id}`);

  const handleLike = (e: any) => {
    e.stopPropagation();
    if (!isAuthenticated) { router.push('/login'); return; }
    onLike?.(poem.id);
  };

  const handleBookmark = (e: any) => {
    e.stopPropagation();
    if (!isAuthenticated) { router.push('/login'); return; }
    onBookmark?.(poem.id);
  };

  const handleShare = (e: any) => {
    e.stopPropagation();
    const text = `${poem.title}\n\n${poem.content}\n\n— ${poem.author?.name ?? ''}`;
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        (navigator as any)
          .share({ title: poem.title, text })
          .catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => alert('¡Copiado al portapapeles!'))
          .catch(() => {});
      }
      return;
    }
    Share.share({ title: poem.title, message: text }).catch(() => {});
  };

  // Show up to 3 lines of content
  const preview = poem.content.split('\n').slice(0, 3).join('\n')
    + (poem.content.split('\n').length > 3 ? '\n…' : '');

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
            <View style={styles.actions}>
              {/* Like — count always visible; interactive only when authenticated */}
              {isAuthenticated ? (
                <Pressable onPress={handleLike} style={styles.actionBtn} hitSlop={8}>
                  <Text style={styles.likeIcon}>{poem.is_liked ? '❤️' : '🤍'}</Text>
                  <Text style={styles.likeCount}>{poem.like_count}</Text>
                </Pressable>
              ) : (
                <View style={styles.actionBtn}>
                  <Text style={styles.likeIcon}>🤍</Text>
                  <Text style={styles.likeCount}>{poem.like_count}</Text>
                </View>
              )}
              {/* Bookmark */}
              {isAuthenticated && (
                <Pressable onPress={handleBookmark} style={styles.actionBtn} hitSlop={8}>
                  <Ionicons
                    name={poem.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={14}
                    color={poem.is_bookmarked ? C.wax : C.pencil}
                  />
                </Pressable>
              )}
              {/* Share */}
              <Pressable onPress={handleShare} style={styles.actionBtn} hitSlop={8}>
                <Ionicons name="share-outline" size={14} color={C.pencil} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

type ThemeColors = ReturnType<typeof useThemedColors>;

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: 6,
      overflow: 'hidden',
      ...Shadows.lift,
    },
    inner: {
      padding: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    titleBlock: {
      alignItems: 'center',
      marginBottom: Spacing.sm,
      width: '100%',
    },
    title: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 22,
      lineHeight: 28,
      color: C.ink,
      textAlign: 'center',
      marginBottom: Spacing.xs + 2,
    },
    divider: {
      width: 32,
      height: 1,
      backgroundColor: C.pencil,
      opacity: 0.3,
      marginTop: 4,
    },
    verseBlock: {
      paddingHorizontal: Spacing.xs,
      marginBottom: Spacing.md,
    },
    verse: {
      fontFamily: Typography.fontFamily.bodyItalic,
      fontSize: 14,
      lineHeight: 14 * 1.85,
      color: C.ink,
      textAlign: 'center',
      opacity: 0.88,
    },
    footer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: C.border.light,
      paddingTop: Spacing.sm,
    },
    timeLabel: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: C.pencil,
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
      color: C.ink,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    likeIcon: {
      fontSize: 12,
    },
    likeCount: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 10,
      color: C.pencil,
    },
  });
}
