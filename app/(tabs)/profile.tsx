import {
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { PoemCard } from '@/features/poems/components/poem-card';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { usersApi, UserStats } from '@/features/users/services/users-api';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { PoemResponse } from '@/features/poems/types/poem';
import { Typography, Spacing } from '@/constants/colors';
import { shareContent } from '@/utils/share';
import { useThemeStore } from '@/store/theme-store';
import { useThemedColors } from '@/hooks/use-themed-colors';

type ActiveTab = 'published' | 'draft' | 'saved' | 'stats';
type ThemeColors = ReturnType<typeof useThemedColors>;

// ─── Emotion label helper ───────────────────────────────────────────────────

const EMOTION_META: Record<string, { emoji: string; label: string }> = {
  melancholic: { emoji: '🌧️', label: 'Melancolía' },
  hopeful: { emoji: '🌅', label: 'Esperanza' },
  serene: { emoji: '🌿', label: 'Serenidad' },
  passionate: { emoji: '🔥', label: 'Pasión' },
  nostalgic: { emoji: '📜', label: 'Nostalgia' },
  inspiring: { emoji: '✨', label: 'Inspiración' },
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, isLoading: authLoading, updateProfile, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleShareProfile = () => {
    if (!user) return;
    const url = `https://oda.app/user/${user.username}`;
    const msg = `${user.name} (@${user.username}) en Oda — ${url}`;
    shareContent({ title: user.name, text: msg });
  };

  const [stats, setStats] = useState<UserStats | null>(null);
  const [poems, setPoems] = useState<PoemResponse[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('published');
  const [isLoadingPoems, setIsLoadingPoems] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // --------------- Data loading ---------------

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingStats(true);
      const data = await usersApi.getUserStats(user.id);
      setStats(data);
    } catch {
      // Stats not critical
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  const loadPoems = useCallback(
    async (tab: ActiveTab = activeTab) => {
      if (!user) return;
      if (tab === 'stats') return; // stats tab doesn't load poems
      try {
        setIsLoadingPoems(true);
        if (tab === 'saved') {
          const data = await poemsApi.getUserBookmarks();
          setPoems(data);
        } else {
          const data = await usersApi.getUserPoems(user.id, tab as 'published' | 'draft');
          setPoems(data as PoemResponse[]);
        }
      } catch {
        setPoems([]);
      } finally {
        setIsLoadingPoems(false);
      }
    },
    [user, activeTab]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadStats(), loadPoems()]);
    setIsRefreshing(false);
  }, [loadStats, loadPoems]);

  useEffect(() => {
    if (user) {
      loadStats();
      loadPoems('published');
    }
  }, [user]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    loadPoems(tab);
  };

  // --------------- Like / Bookmark / Publish ---------------

  const toggleLike = useCallback(async (poemId: string) => {
    try {
      const isLiked = await poemsApi.toggleLike(poemId);
      setPoems((prev) =>
        prev.map((poem) =>
          poem.id === poemId
            ? {
                ...poem,
                is_liked: isLiked,
                like_count: isLiked
                  ? (Number.isFinite(poem.like_count) ? poem.like_count : 0) + 1
                  : Math.max(0, (Number.isFinite(poem.like_count) ? poem.like_count : 0) - 1),
              }
            : poem
        )
      );
    } catch {
      /* ignore */
    }
  }, []);

  const toggleBookmark = useCallback(async (poemId: string) => {
    try {
      const isBookmarked = await poemsApi.toggleBookmark(poemId);
      setPoems((prev) =>
        prev.map((poem) =>
          poem.id === poemId ? { ...poem, is_bookmarked: isBookmarked } : poem
        )
      );
    } catch {
      /* ignore */
    }
  }, []);

  const publishDraft = useCallback(
    async (poemId: string) => {
      try {
        await poemsApi.updatePoem(poemId, { status: 'published' });
        setPoems((prev) => prev.filter((p) => p.id !== poemId));
        loadStats();
      } catch {
        /* ignore */
      }
    },
    [loadStats]
  );

  // --------------- Edit profile ---------------

  const openEdit = () => {
    setEditName(user?.name ?? '');
    setEditBio(user?.bio ?? '');
    setEditAvatarUrl(user?.avatar_url ?? user?.avatar ?? '');
    setEditWebsite(user?.website ?? '');
    setEditInstagram(user?.instagram ?? '');
    setEditTwitter(user?.twitter ?? '');
    setEditError(null);
    setEditVisible(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      setEditError('El nombre no puede estar vacío');
      return;
    }
    try {
      setIsSaving(true);
      setEditError(null);
      await updateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl.trim(),
        website: editWebsite.trim(),
        instagram: editInstagram.trim().replace(/^@/, ''),
        twitter: editTwitter.trim().replace(/^@/, ''),
      });
      setEditVisible(false);
    } catch (err: any) {
      setEditError(err.response?.data?.error ?? 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const pickAvatarImage = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      setEditError('Por ahora la subida directa está disponible en web. En móvil usá una URL de imagen.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (result) {
          setEditAvatarUrl(result);
          setEditError(null);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // --------------- Helpers ---------------

  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  // --------------- Render: Stats tab content ---------------

  const renderStatsContent = () => {
    if (isLoadingStats) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={C.ink} />
        </View>
      );
    }
    if (!stats) {
      return (
        <View style={styles.centered}>
          <Text variant="body" style={styles.emptyText}>
            No hay estadísticas disponibles
          </Text>
        </View>
      );
    }

    const emotionEntries = stats.emotion_distribution
      ? Object.entries(stats.emotion_distribution).sort(([, a], [, b]) => b - a)
      : [];
    const maxEmotion = emotionEntries.length > 0 ? emotionEntries[0][1] : 1;

    return (
      <View style={styles.statsContainer}>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <KpiCard icon="book" value={stats.published_count} label="Publicados" C={C} />
          <KpiCard icon="eye" value={stats.total_views} label="Lecturas" C={C} />
          <KpiCard icon="heart" value={stats.total_likes} label="Me gusta" C={C} />
          <KpiCard icon="bookmark" value={stats.total_bookmarks} label="Guardados" C={C} />
        </View>

        {/* Bar chart — simple View-based bars */}
        <View style={styles.chartCard}>
          <Text variant="ui" style={styles.chartTitle}>Resumen de actividad</Text>
          <View style={styles.barChartContainer}>
            <BarItem
              label="Publicados"
              value={stats.published_count}
              max={Math.max(stats.published_count, stats.draft_count, stats.total_likes, stats.total_views, 1)}
              color={C.wax}
              C={C}
            />
            <BarItem
              label="Borradores"
              value={stats.draft_count}
              max={Math.max(stats.published_count, stats.draft_count, stats.total_likes, stats.total_views, 1)}
              color={C.ink}
              C={C}
            />
            <BarItem
              label="Me gusta"
              value={stats.total_likes}
              max={Math.max(stats.published_count, stats.draft_count, stats.total_likes, stats.total_views, 1)}
              color="#D4A373"
              C={C}
            />
            <BarItem
              label="Lecturas"
              value={stats.total_views}
              max={Math.max(stats.published_count, stats.draft_count, stats.total_likes, stats.total_views, 1)}
              color={C.pencil}
              C={C}
            />
          </View>
        </View>

        {/* Emotion distribution */}
        {emotionEntries.length > 0 && (
          <View style={styles.chartCard}>
            <Text variant="ui" style={styles.chartTitle}>Emociones que inspiras</Text>
            <View style={styles.emotionBarsContainer}>
              {emotionEntries.map(([emotion, count]) => {
                const meta = EMOTION_META[emotion] ?? { emoji: '💫', label: emotion };
                const pct = maxEmotion > 0 ? (count / maxEmotion) * 100 : 0;
                return (
                  <View key={emotion} style={styles.emotionBarRow}>
                    <Text style={styles.emotionBarLabel}>
                      {meta.emoji} {meta.label}
                    </Text>
                    <View style={styles.emotionBarTrack}>
                      <View
                        style={[
                          styles.emotionBarFill,
                          { width: `${Math.max(pct, 4)}%`, backgroundColor: C.wax },
                        ]}
                      />
                    </View>
                    <Text variant="ui" style={styles.emotionBarCount}>
                      {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick stats row */}
        <View style={styles.chartCard}>
          <Text variant="ui" style={styles.chartTitle}>Total</Text>
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatItem}>
              <Text variant="display" style={styles.quickStatValue}>
                {formatStatNumber(stats.poem_count)}
              </Text>
              <Text variant="ui" style={styles.quickStatLabel}>Poemas</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text variant="display" style={styles.quickStatValue}>
                {formatStatNumber(stats.total_bookmarks)}
              </Text>
              <Text variant="ui" style={styles.quickStatLabel}>Guardados</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text variant="display" style={styles.quickStatValue}>
                {stats.published_count > 0
                  ? (stats.total_likes / stats.published_count).toFixed(1)
                  : '0'}
              </Text>
              <Text variant="ui" style={styles.quickStatLabel}>♥ / poema</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // --------------- Render: Profile header ---------------

  const renderProfileHeader = () => (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text variant="display" style={styles.appTitle}>
          ODA
        </Text>
        <View style={styles.topBarActions}>
          <Pressable onPress={handleShareProfile} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="share-outline" size={20} color={C.ink} />
          </Pressable>
          <Pressable style={styles.editBtn} onPress={openEdit}>
            <Text variant="ui" style={styles.editBtnText}>
              Editar
            </Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="log-out-outline" size={20} color={C.wax} />
          </Pressable>
        </View>
      </View>

      {/* Avatar + identity */}
      <View style={styles.heroSection}>
        <View style={styles.avatarCircle}>
          {user?.avatar_url || user?.avatar ? (
            <Image
              source={{ uri: user.avatar_url ?? user.avatar }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text variant="display" style={styles.avatarText}>
              {initials(user?.name ?? user?.username ?? '?')}
            </Text>
          )}
        </View>
        <Text variant="display" style={styles.displayName}>
          {user?.name}
        </Text>
        <Text variant="body" style={styles.username}>
          @{user?.username}
        </Text>
        {user?.bio ? (
          <Text variant="bodyItalic" style={styles.bio}>
            {user.bio}
          </Text>
        ) : (
          <Pressable onPress={openEdit}>
            <Text variant="ui" style={styles.bioPlaceholder}>
              + Añadir una bio
            </Text>
          </Pressable>
        )}

        {/* Social links */}
        <View style={styles.socialRow}>
          {user?.website ? (
            <Pressable
              style={styles.socialLink}
              onPress={() =>
                Linking.openURL(
                  user.website!.startsWith('http')
                    ? user.website!
                    : `https://${user.website}`
                )
              }
            >
              <Ionicons name="globe-outline" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText} numberOfLines={1}>
                {user.website.replace(/^https?:\/\//, '')}
              </Text>
            </Pressable>
          ) : null}
          {user?.instagram ? (
            <Pressable
              style={styles.socialLink}
              onPress={() =>
                Linking.openURL(`https://instagram.com/${user.instagram}`)
              }
            >
              <Ionicons name="logo-instagram" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText}>
                @{user.instagram}
              </Text>
            </Pressable>
          ) : null}
          {user?.twitter ? (
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL(`https://x.com/${user.twitter}`)}
            >
              <Ionicons name="logo-twitter" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText}>
                @{user.twitter}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Quick metrics — 2×2 grid */}
      <View style={styles.metricsCard}>
        <View style={styles.metricsRow}>
          <StatPill
            value={stats?.published_count ?? 0}
            label="publicados"
            loading={isLoadingStats}
            C={C}
          />
          <View style={styles.statsDivider} />
          <StatPill
            value={stats?.draft_count ?? 0}
            label="borradores"
            loading={isLoadingStats}
            C={C}
          />
        </View>
        <View style={[styles.statsDivider, styles.statsHDivider]} />
        <View style={styles.metricsRow}>
          <StatPill
            value={stats?.total_likes ?? 0}
            label="me gusta"
            loading={isLoadingStats}
            C={C}
          />
          <View style={styles.statsDivider} />
          <StatPill
            value={stats?.total_views ?? 0}
            label="lecturas"
            loading={isLoadingStats}
            C={C}
          />
        </View>
      </View>

      {/* Compose CTA */}
      <Pressable style={styles.composeCta} onPress={() => router.push('/compose')}>
        <Text variant="ui" style={styles.composeCtaText}>
          ✍️  Escribir poema
        </Text>
      </Pressable>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['published', 'draft', 'saved', 'stats'] as ActiveTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabChange(tab)}
          >
            <Text
              variant="ui"
              style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}
            >
              {tab === 'published'
                ? 'Obras'
                : tab === 'draft'
                ? 'Borradores'
                : tab === 'saved'
                ? 'Guardados'
                : 'Estadísticas'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* If stats tab, render inline stats content */}
      {activeTab === 'stats' && renderStatsContent()}
    </View>
  );

  const renderEmpty = () => {
    if (activeTab === 'stats') return null; // stats has its own content

    if (isLoadingPoems) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={C.ink} />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Text variant="body" style={styles.emptyText}>
          {activeTab === 'published'
            ? 'Aún no has publicado ningún poema'
            : activeTab === 'draft'
            ? 'No tienes borradores guardados'
            : 'No tienes poemas guardados aún'}
        </Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.push('/compose')}>
          <Text variant="ui" style={styles.emptyBtnText}>
            Escribir ahora
          </Text>
        </Pressable>
      </View>
    );
  };

  // --------------- Not authenticated ---------------

  if (!user && !authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text variant="display" style={styles.displayName}>
            Bienvenido a Oda
          </Text>
          <Text variant="body" style={styles.emptyText}>
            Inicia sesión para ver tu perfil
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/login')}>
            <Text variant="ui" style={styles.emptyBtnText}>
              Iniciar sesión
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.emptyBtn,
              {
                marginTop: 12,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: C.ink,
              },
            ]}
            onPress={() => router.push('/register')}
          >
            <Text variant="ui" style={[styles.emptyBtnText, { color: C.ink }]}>
              Crear cuenta
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --------------- Main render ---------------

  return (
    <SafeAreaView style={styles.container}>
      <FlatList<PoemResponse>
        data={activeTab === 'stats' ? [] : poems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.poemCardWrapper}>
            <PoemCard
              poem={item}
              onLike={toggleLike}
              onBookmark={toggleBookmark}
            />
            {/* Draft actions */}
            {activeTab === 'draft' && (
              <View style={styles.draftActions}>
                <Pressable
                  style={styles.draftEditBtn}
                  onPress={() => router.push(`/compose?id=${item.id}`)}
                >
                  <Ionicons name="create-outline" size={14} color={C.ink} />
                  <Text variant="ui" style={styles.draftEditText}>
                    Editar
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.draftPublishBtn}
                  onPress={() => publishDraft(item.id)}
                >
                  <Ionicons name="rocket-outline" size={14} color={C.paper} />
                  <Text variant="ui" style={styles.draftPublishText}>
                    Publicar
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
        ListHeaderComponent={renderProfileHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={C.ink}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditVisible(false)}>
              <Text variant="ui" style={styles.modalCancel}>
                Cancelar
              </Text>
            </Pressable>
            <Text variant="ui" style={styles.modalTitle}>
              Editar perfil
            </Text>
            <Pressable onPress={saveProfile} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color={C.wax} size="small" />
              ) : (
                <Text variant="uiBold" style={styles.modalSave}>
                  Guardar
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {editError ? (
              <Text variant="ui" style={styles.modalError}>
                {editError}
              </Text>
            ) : null}

            <Text variant="ui" style={styles.fieldLabel}>
              Nombre
            </Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              placeholderTextColor={C.pencil}
              maxLength={80}
            />

            <Text variant="ui" style={styles.fieldLabel}>
              Bio
            </Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMultiline]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Una frase que te defina..."
              placeholderTextColor={C.pencil}
              multiline
              numberOfLines={4}
              maxLength={300}
            />
            <Text variant="ui" style={styles.charCount}>
              {editBio.length}/300
            </Text>

            <Text variant="ui" style={styles.fieldLabel}>
              Avatar URL
            </Text>
            <Pressable style={styles.uploadBtn} onPress={pickAvatarImage}>
              <Ionicons name="image-outline" size={14} color={C.ink} />
              <Text variant="ui" style={styles.uploadBtnText}>
                Subir imagen
              </Text>
            </Pressable>
            <TextInput
              style={styles.fieldInput}
              value={editAvatarUrl}
              onChangeText={setEditAvatarUrl}
              placeholder="https://.../avatar.jpg"
              placeholderTextColor={C.pencil}
              autoCapitalize="none"
              keyboardType="url"
              maxLength={300}
            />

            <Text variant="ui" style={styles.fieldLabel}>
              Sitio web
            </Text>
            <TextInput
              style={styles.fieldInput}
              value={editWebsite}
              onChangeText={setEditWebsite}
              placeholder="https://tu-web.com"
              placeholderTextColor={C.pencil}
              autoCapitalize="none"
              keyboardType="url"
              maxLength={200}
            />

            <Text variant="ui" style={styles.fieldLabel}>
              Instagram
            </Text>
            <TextInput
              style={styles.fieldInput}
              value={editInstagram}
              onChangeText={setEditInstagram}
              placeholder="@usuario"
              placeholderTextColor={C.pencil}
              autoCapitalize="none"
              maxLength={60}
            />

            <Text variant="ui" style={styles.fieldLabel}>
              Twitter / X
            </Text>
            <TextInput
              style={[styles.fieldInput, { marginBottom: Spacing['2xl'] }]}
              value={editTwitter}
              onChangeText={setEditTwitter}
              placeholder="@usuario"
              placeholderTextColor={C.pencil}
              autoCapitalize="none"
              maxLength={60}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatPill({
  value,
  label,
  loading,
  C,
}: {
  value: number;
  label: string;
  loading: boolean;
  C: ThemeColors;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      {loading ? (
        <ActivityIndicator color={C.ink} size="small" />
      ) : (
        <Text variant="display" style={{ fontSize: 22, color: C.ink }}>
          {formatStatNumber(value)}
        </Text>
      )}
      <Text
        variant="ui"
        style={{
          fontSize: 10,
          color: C.pencil,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function KpiCard({
  icon,
  value,
  label,
  C,
}: {
  icon: string;
  value: number;
  label: string;
  C: ThemeColors;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border.light,
      }}
    >
      <Ionicons name={icon as any} size={20} color={C.wax} />
      <Text
        variant="display"
        style={{ fontSize: 24, color: C.ink, marginTop: 4 }}
      >
        {formatStatNumber(value)}
      </Text>
      <Text
        variant="ui"
        style={{
          fontSize: 9,
          color: C.pencil,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function BarItem({
  label,
  value,
  max,
  color,
  C,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  C: ThemeColors;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text
          variant="ui"
          style={{ fontSize: 11, color: C.pencil, letterSpacing: 0.5 }}
        >
          {label}
        </Text>
        <Text
          variant="ui"
          style={{ fontSize: 11, color: C.ink, fontWeight: '600' }}
        >
          {formatStatNumber(value)}
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: `${C.pencil}20`,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.max(pct, 2)}%`,
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}

function formatStatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Styles ─────────────────────────────────────────────────────────────────

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.paper,
    },
    listContent: {
      paddingBottom: Spacing['2xl'],
    },

    // Top bar
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border.light,
    },
    topBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appTitle: {
      fontSize: Typography.fontSize['3xl'],
      letterSpacing: 8,
      color: C.ink,
    },
    editBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.ink,
    },
    editBtnText: {
      fontSize: Typography.fontSize.sm,
      color: C.ink,
    },

    // Hero
    heroSection: {
      alignItems: 'center',
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
    },
    avatarCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: C.wax,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontSize: Typography.fontSize['2xl'],
      color: '#fff',
      letterSpacing: 2,
    },
    displayName: {
      fontSize: Typography.fontSize['2xl'],
      color: C.ink,
      textAlign: 'center',
      marginBottom: 4,
    },
    username: {
      fontSize: Typography.fontSize.base,
      color: C.pencil,
      marginBottom: Spacing.sm,
    },
    bio: {
      fontSize: Typography.fontSize.base,
      color: C.ink,
      textAlign: 'center',
      lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
      maxWidth: 300,
      marginBottom: Spacing.sm,
    },
    bioPlaceholder: {
      fontSize: Typography.fontSize.base,
      color: C.pencil,
      textDecorationLine: 'underline',
    },

    // Social links
    socialRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      marginTop: Spacing.sm,
    },
    socialLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    socialLinkText: {
      fontSize: Typography.fontSize.sm,
      color: C.wax,
      maxWidth: 120,
    },

    // Metrics card (2×2 grid)
    metricsCard: {
      marginHorizontal: Spacing.md,
      borderRadius: 12,
      backgroundColor: C.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border.light,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    statsDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: C.border.medium,
    },
    statsHDivider: {
      width: '100%',
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border.light,
    },

    // Compose CTA
    composeCta: {
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: C.ink,
      alignItems: 'center',
    },
    composeCtaText: {
      color: C.surface,
      fontSize: Typography.fontSize.base,
      letterSpacing: 1,
    },

    // Tabs
    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: C.border.light,
      marginBottom: Spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm + 2,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: C.wax,
    },
    tabLabel: {
      fontSize: Typography.fontSize.xs,
      color: C.pencil,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    tabLabelActive: {
      color: C.ink,
    },

    // Poem cards
    poemCardWrapper: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    draftActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      paddingHorizontal: Spacing.sm,
      paddingTop: Spacing.xs,
    },
    draftEditBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.ink,
    },
    draftEditText: {
      fontSize: Typography.fontSize.xs,
      color: C.ink,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    draftPublishBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: 16,
      backgroundColor: C.wax,
    },
    draftPublishText: {
      fontSize: Typography.fontSize.xs,
      color: C.paper,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },

    // Stats content
    statsContainer: {
      padding: Spacing.md,
      gap: Spacing.md,
    },
    kpiGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    chartCard: {
      backgroundColor: C.surface,
      borderRadius: 12,
      padding: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border.light,
    },
    chartTitle: {
      fontSize: Typography.fontSize.xs,
      color: C.pencil,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: Spacing.md,
    },
    barChartContainer: {
      gap: Spacing.sm,
    },
    emotionBarsContainer: {
      gap: 10,
    },
    emotionBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    emotionBarLabel: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 12,
      color: C.ink,
      width: 90,
    },
    emotionBarTrack: {
      flex: 1,
      height: 10,
      backgroundColor: `${C.pencil}18`,
      borderRadius: 5,
      overflow: 'hidden',
    },
    emotionBarFill: {
      height: '100%',
      borderRadius: 5,
    },
    emotionBarCount: {
      fontSize: 11,
      color: C.pencil,
      width: 28,
      textAlign: 'right',
    },
    quickStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quickStatItem: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    quickStatDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: C.border.medium,
    },
    quickStatValue: {
      fontSize: 20,
      color: C.ink,
    },
    quickStatLabel: {
      fontSize: 9,
      color: C.pencil,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // Empty / loading states
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['2xl'],
      paddingHorizontal: Spacing.lg,
    },
    emptyText: {
      fontSize: Typography.fontSize.base,
      color: C.pencil,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    emptyBtn: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.ink,
    },
    emptyBtnText: {
      color: C.ink,
      fontSize: Typography.fontSize.sm,
    },

    // Edit modal
    modalContainer: {
      flex: 1,
      backgroundColor: C.paper,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border.light,
    },
    modalTitle: {
      fontSize: Typography.fontSize.base,
      color: C.ink,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    modalCancel: {
      fontSize: Typography.fontSize.base,
      color: C.pencil,
    },
    modalSave: {
      fontSize: Typography.fontSize.base,
      color: C.wax,
    },
    modalBody: {
      flex: 1,
      padding: Spacing.md,
    },
    modalError: {
      color: C.wax,
      fontSize: Typography.fontSize.sm,
      marginBottom: Spacing.md,
    },
    fieldLabel: {
      fontSize: Typography.fontSize.xs,
      color: C.pencil,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
    },
    fieldInput: {
      borderWidth: 1,
      borderColor: C.border.light,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.body,
      color: C.ink,
      backgroundColor: C.surface,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: C.border.light,
      borderRadius: 8,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
      backgroundColor: C.surface,
    },
    uploadBtnText: {
      color: C.ink,
      fontSize: Typography.fontSize.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    fieldInputMultiline: {
      height: 100,
      textAlignVertical: 'top',
      paddingTop: Spacing.sm + 2,
    },
    charCount: {
      fontSize: Typography.fontSize.xs,
      color: C.pencil,
      textAlign: 'right',
      marginTop: 4,
    },
  });
}
