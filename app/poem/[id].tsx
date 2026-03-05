import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Spacing, Typography, Shadows } from '@/constants/colors';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { PoemResponse, EmotionType } from '@/features/poems/types/poem';
import { EmotionSelector } from '@/features/poems/components/emotion-selector';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { shareContent } from '@/utils/share';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useThemedColors } from '@/hooks/use-themed-colors';

type ThemeColors = ReturnType<typeof useThemedColors>;

const EMOTION_EMOJI: Record<string, string> = {
  melancholic: '😔',
  hopeful:     '🌟',
  serene:      '☮️',
  passionate:  '🔥',
  nostalgic:   '🍂',
  inspiring:   '✨',
};

export default function PoemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [poem, setPoem] = useState<PoemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emotionVisible, setEmotionVisible] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const requireAuth = (cb: () => void) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    cb();
  };

  useEffect(() => { loadPoem(); }, [id]);

  const loadPoem = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await poemsApi.getPoemById(id);
      setPoem(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el poema');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = () => requireAuth(async () => {
    if (!poem) return;
    try {
      const isLiked = await poemsApi.toggleLike(poem.id);
      const currentLikes = Number.isFinite(poem.like_count) ? poem.like_count : 0;
      setPoem({
        ...poem,
        is_liked: isLiked,
        like_count: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
      });
    } catch {}
  });

  const handleBookmark = () => requireAuth(async () => {
    if (!poem) return;
    try {
      const isBookmarked = await poemsApi.toggleBookmark(poem.id);
      setPoem({ ...poem, is_bookmarked: isBookmarked });
    } catch {}
  });

  const handleShare = async () => {
    if (!poem) return;
    const message = `${poem.title}\n\n${poem.content}\n\n\u2014 ${poem.author?.name ?? ''}`;
    await shareContent({ title: poem.title, text: message });
  };

  const handleSelectEmotion = async (emotionId: string, _emotion: EmotionType) => {
    if (!poem) return;
    try {
      if (!emotionId) return;
      await poemsApi.tagEmotion(poem.id, emotionId);
      const updated = await poemsApi.getPoemById(poem.id);
      setPoem(updated);
    } catch {}
  };

  const handleRemoveEmotion = async () => {
    if (!poem) return;
    try {
      await poemsApi.removeEmotionTag(poem.id);
      const updated = await poemsApi.getPoemById(poem.id);
      setPoem(updated);
    } catch {}
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Oda' }} />
        <ActivityIndicator size="large" color={C.ink} />
      </View>
    );
  }

  if (error || !poem) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Oda' }} />
        <Text style={styles.errorText}>{error || 'Poema no encontrado'}</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <Text style={styles.backLink}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(poem.created_at), { addSuffix: true, locale: es });
  const initials = poem.author?.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={styles.root}>
      {/* Page title for web SEO */}
      <Stack.Screen options={{ title: `${poem.title} — Oda` }} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </Pressable>
        <Text style={styles.appTitle}>ODA</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Poem card ── */}
        <View style={styles.poemCard}>
          <Text style={styles.poemTitle}>{poem.title}</Text>
          <View style={styles.rule} />
          <Text style={styles.poemContent}>{poem.content}</Text>
        </View>

        {/* ── Author row ── */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Pressable onPress={() => poem.author?.username && router.push(`/user/${poem.author.username}` as any)}>
              <Text style={styles.authorName}>{poem.author?.name}</Text>
            </Pressable>
            <Text style={styles.authorHandle}>@{poem.author?.username} · {timeAgo}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name={poem.is_liked ? 'heart' : 'heart-outline'} size={16} color={poem.is_liked ? C.wax : C.pencil} />
            <Text style={styles.statValue}>{Number.isFinite(poem.like_count) ? poem.like_count : 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={16} color={C.pencil} />
            <Text style={styles.statValue}>{Number.isFinite(poem.view_count) ? poem.view_count : 0}</Text>
          </View>
        </View>

        {/* ── Emotion tags ── */}
        {poem.emotion_counts && Object.keys(poem.emotion_counts).length > 0 && (
          <View style={styles.emotionsSection}>
            <Text style={styles.emotionsSectionLabel}>Reacciones</Text>
            <View style={styles.emotionTags}>
              {Object.entries(poem.emotion_counts).map(([emotion, count]) => (
                <View key={emotion} style={styles.emotionTag}>
                  <Text style={styles.emotionTagEmoji}>{EMOTION_EMOJI[emotion] ?? '💭'}</Text>
                  <Text style={styles.emotionTagCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Action bar ── */}
      <View style={styles.actionBar}>
        <Pressable onPress={handleLike} style={styles.action}>
          <Ionicons
            name={poem.is_liked ? 'heart' : 'heart-outline'}
            size={24}
            color={poem.is_liked ? C.wax : C.ink}
          />
          <Text style={styles.actionLabel}>Me gusta</Text>
        </Pressable>

        <Pressable onPress={() => requireAuth(() => setEmotionVisible(true))} style={styles.action}>
          <Text style={{ fontSize: 22 }}>
            {poem.user_emotion ? EMOTION_EMOJI[poem.user_emotion] : '💭'}
          </Text>
          <Text style={styles.actionLabel}>Sentir</Text>
        </Pressable>

        <Pressable onPress={handleBookmark} style={styles.action}>
          <Ionicons
            name={poem.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={poem.is_bookmarked ? C.wax : C.ink}
          />
          <Text style={styles.actionLabel}>Guardar</Text>
        </Pressable>

        <Pressable onPress={handleShare} style={styles.action}>
          <Ionicons name="share-outline" size={24} color={C.ink} />
          <Text style={styles.actionLabel}>Compartir</Text>
        </Pressable>
      </View>

      {/* ── Emotion Selector ── */}
      <EmotionSelector
        visible={emotionVisible}
        onClose={() => setEmotionVisible(false)}
        selectedEmotion={poem.user_emotion}
        onSelect={handleSelectEmotion}
        onRemove={poem.user_emotion ? handleRemoveEmotion : undefined}
      />
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.paper },
    centered: { flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    errorText: { fontFamily: Typography.fontFamily.ui, color: C.wax, textAlign: 'center' },
    backLink: { fontFamily: Typography.fontFamily.uiBold, color: C.ink, fontSize: 14 },

    header: {
      paddingTop: 52,
      paddingBottom: 12,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.paper,
      borderBottomWidth: 1,
      borderBottomColor: C.border.light,
    },
    backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    appTitle: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 22,
      letterSpacing: 6,
      color: C.ink,
    },

    scroll: { paddingBottom: Spacing['2xl'] },

    poemCard: {
      margin: Spacing.lg,
      backgroundColor: C.surface,
      borderRadius: 6,
      padding: Spacing.xl,
      alignItems: 'center',
      ...Shadows.lift,
    },
    poemTitle: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 30,
      lineHeight: 38,
      color: C.ink,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    rule: {
      width: 40,
      height: 1,
      backgroundColor: C.pencil,
      opacity: 0.3,
      marginBottom: Spacing.xl,
    },
    poemContent: {
      fontFamily: Typography.fontFamily.bodyItalic,
      fontSize: 18,
      lineHeight: 32,
      color: C.ink,
      textAlign: 'center',
      opacity: 0.92,
    },

    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${C.pencil}30`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 18,
      color: C.ink,
    },
    authorName: {
      fontFamily: Typography.fontFamily.uiBold,
      fontSize: 13,
      letterSpacing: 0.5,
      color: C.ink,
    },
    authorHandle: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 11,
      color: C.pencil,
      marginTop: 2,
    },

    statsRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: C.border.light,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statValue: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 13,
      color: C.pencil,
    },

    emotionsSection: {
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
    },
    emotionsSectionLabel: {
      fontFamily: Typography.fontFamily.uiBold,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: C.pencil,
      marginBottom: Spacing.sm,
    },
    emotionTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    emotionTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: C.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.border.light,
    },
    emotionTagEmoji: { fontSize: 14 },
    emotionTagCount: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 11,
      color: C.pencil,
    },

    actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: C.border.light,
      backgroundColor: C.paper,
      paddingVertical: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    action: { alignItems: 'center', gap: 4 },
    actionLabel: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: C.pencil,
    },
  });
}
