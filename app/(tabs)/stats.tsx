import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Text } from '@/components/ui/text';
import { Spacing, Typography, Shadows } from '@/constants/colors';
import { useThemedColors } from '@/hooks/use-themed-colors';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { usersApi, UserStats } from '@/features/users/services/users-api';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { EmotionCatalogEntry } from '@/features/poems/services/poems-api';
import { Redirect } from 'expo-router';

type ThemeColors = ReturnType<typeof useThemedColors>;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default function StatsScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [catalog, setCatalog] = useState<EmotionCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  if (!isAuthenticated || !user) return <Redirect href="/login" />;

  const loadData = useCallback(async () => {
    try {
      const [statsData, catalogData] = await Promise.all([
        usersApi.getUserStats(user.id),
        poemsApi.getEmotionCatalog().catch(() => []),
      ]);
      setStats(statsData);
      setCatalog(catalogData);
    } catch {
      // best-effort
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Build emotion cloud data
  const emotionCloud = useMemo(() => {
    if (!stats?.emotion_distribution) return [];
    const dist = stats.emotion_distribution;
    const maxCount = Math.max(...Object.values(dist), 1);
    return Object.entries(dist)
      .sort(([, a], [, b]) => b - a)
      .map(([slug, count]) => {
        const cat = catalog.find((c) => c.slug === slug);
        const size = 14 + Math.round((count / maxCount) * 22); // 14..36
        return {
          slug,
          label: cat?.label ?? slug,
          emoji: cat?.emoji ?? '',
          count,
          fontSize: size,
          opacity: 0.4 + (count / maxCount) * 0.6,
        };
      });
  }, [stats?.emotion_distribution, catalog]);

  // Compute resonance: ratio of interactions (likes + bookmarks + emotions) to views
  const resonance = useMemo(() => {
    if (!stats || stats.total_views === 0) return 0;
    const emotionTotal = stats.emotion_distribution
      ? Object.values(stats.emotion_distribution).reduce((s, v) => s + v, 0)
      : 0;
    const interactions = stats.total_likes + stats.total_bookmarks + emotionTotal;
    return Math.min(Math.round((interactions / stats.total_views) * 100), 100);
  }, [stats]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.ink} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.pencil} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Impacto</Text>
        <View style={styles.headerRule} />
      </View>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <KpiCard label="Lectores" value={formatNumber(stats?.total_views ?? 0)} C={C} styles={styles} />
        <KpiCard label="Guardados" value={formatNumber(stats?.total_bookmarks ?? 0)} C={C} styles={styles} />
        <KpiCard
          label="Resonancia"
          value={`${resonance}%`}
          accent
          C={C}
          styles={styles}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <QuickStat label="Obras" value={stats?.published_count ?? 0} C={C} styles={styles} />
        <View style={styles.quickDivider} />
        <QuickStat label="Likes" value={stats?.total_likes ?? 0} C={C} styles={styles} />
        <View style={styles.quickDivider} />
        <QuickStat label="Borradores" value={stats?.draft_count ?? 0} C={C} styles={styles} />
      </View>

      {/* Emotional Echo */}
      {emotionCloud.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Eco Emocional</Text>
            <Text style={styles.sectionSubtitle}>SENTIMIENTO</Text>
          </View>

          <View style={styles.emotionCloudCard}>
            {/* Decorative circles */}
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />

            <View style={styles.emotionCloudInner}>
              {emotionCloud.map((e) => (
                <Text
                  key={e.slug}
                  style={[
                    styles.emotionWord,
                    {
                      fontSize: e.fontSize,
                      opacity: e.opacity,
                      color: e.fontSize > 28 ? C.wax : C.ink,
                    },
                  ]}
                >
                  {e.emoji} {e.label}
                </Text>
              ))}
            </View>

            <Text style={styles.emotionHint}>
              Palabras seleccionadas por tus lectores al terminar un poema.
            </Text>
          </View>
        </View>
      )}

      {/* Empty state if no stats */}
      {(stats?.published_count ?? 0) === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>Tu impacto comienza aquí</Text>
          <Text style={styles.emptyText}>
            Publica tu primer poema y descubre cómo resuena entre los lectores.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function KpiCard({
  label,
  value,
  accent,
  C,
  styles,
}: {
  label: string;
  value: string;
  accent?: boolean;
  C: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, accent && { color: C.wax }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function QuickStat({
  label,
  value,
  C,
  styles,
}: {
  label: string;
  value: number;
  C: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.quickStatItem}>
      <Text style={styles.quickStatValue}>{formatNumber(value)}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.paper },
    centered: { flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
    content: {
      paddingBottom: Spacing['2xl'],
    },

    // Header
    header: {
      alignItems: 'center',
      paddingTop: 56,
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 30,
      color: C.ink,
      letterSpacing: 0.5,
    },
    headerRule: {
      width: 48,
      height: 1,
      backgroundColor: C.pencil,
      opacity: 0.3,
      marginTop: Spacing.md,
    },

    // KPI row
    kpiRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    kpiCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      backgroundColor: C.surface,
      borderRadius: 2,
      ...Shadows.lift,
    },
    kpiValue: {
      fontFamily: Typography.fontFamily.uiBold,
      fontSize: 26,
      color: C.ink,
      marginBottom: 4,
    },
    kpiLabel: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 16,
      color: C.pencil,
      fontStyle: 'italic',
    },

    // Quick stats bar
    quickStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: C.border.light,
    },
    quickStatItem: {
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    quickStatValue: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 22,
      color: C.ink,
    },
    quickStatLabel: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 10,
      color: C.pencil,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    quickDivider: {
      width: 1,
      height: 32,
      backgroundColor: C.border.light,
    },

    // Section
    section: {
      marginTop: Spacing.xl + Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 24,
      color: C.ink,
    },
    sectionSubtitle: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 10,
      color: C.pencil,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },

    // Emotion cloud
    emotionCloudCard: {
      backgroundColor: C.surface,
      paddingVertical: Spacing.xl + Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: 2,
      minHeight: 240,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...Shadows.lift,
    },
    emotionCloudInner: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.md,
    },
    emotionWord: {
      fontFamily: Typography.fontFamily.body,
      fontStyle: 'italic',
    },
    emotionHint: {
      fontFamily: Typography.fontFamily.body,
      fontSize: 13,
      color: C.pencil,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: Spacing.lg,
    },
    decorCircle: {
      position: 'absolute',
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: `${C.pencil}15`,
    },
    decorCircle1: {
      width: 128,
      height: 128,
    },
    decorCircle2: {
      width: 192,
      height: 192,
    },

    // Empty state
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing['2xl'],
    },
    emptyIcon: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 32,
      color: C.pencil,
      opacity: 0.5,
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 22,
      color: C.ink,
      marginBottom: Spacing.sm,
    },
    emptyText: {
      fontFamily: Typography.fontFamily.body,
      fontSize: 15,
      color: C.pencil,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
}
