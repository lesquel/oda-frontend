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
  Share,
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
import { useThemeStore } from '@/store/theme-store';
import { useThemedColors } from '@/hooks/use-themed-colors';

type ActiveTab = 'published' | 'draft' | 'saved';
type ThemeColors = ReturnType<typeof useThemedColors>;

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
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      return;
    }
    Share.share({ title: user.name, message: msg }).catch(() => {});
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
      try {
        setIsLoadingPoems(true);
        if (tab === 'saved') {
          const data = await poemsApi.getUserBookmarks();
          setPoems(data);
        } else {
          const data = await usersApi.getUserPoems(user.id, tab as 'published' | 'draft');
          setPoems(data.map((p) => ({ ...p, is_liked: false, is_bookmarked: false })));
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

  // --------------- Edit profile ---------------

  const openEdit = () => {
    setEditName(user?.name ?? '');
    setEditBio(user?.bio ?? '');
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

  // --------------- Helpers ---------------

  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  // --------------- Render helpers ---------------

  const renderProfileHeader = () => (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text variant="display" style={styles.appTitle}>
          ODA
        </Text>
        <View style={styles.topBarActions}>
          <Pressable onPress={toggleTheme} style={styles.iconBtn} hitSlop={8}>
            <Ionicons
              name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={C.ink}
            />
          </Pressable>
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
          <Text variant="display" style={styles.avatarText}>
            {initials(user?.name ?? user?.username ?? '?')}
          </Text>
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
              onPress={() => Linking.openURL(
                user.website!.startsWith('http') ? user.website! : `https://${user.website}`
              )}>
              <Ionicons name="globe-outline" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText} numberOfLines={1}>
                {user.website.replace(/^https?:\/\//, '')}
              </Text>
            </Pressable>
          ) : null}
          {user?.instagram ? (
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL(`https://instagram.com/${user.instagram}`)}>
              <Ionicons name="logo-instagram" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText}>
                @{user.instagram}
              </Text>
            </Pressable>
          ) : null}
          {user?.twitter ? (
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL(`https://x.com/${user.twitter}`)}>
              <Ionicons name="logo-twitter" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText}>
                @{user.twitter}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Métricas de actividad — 2×2 grid */}
      <View style={styles.metricsCard}>
        <View style={styles.metricsRow}>
          <StatPill value={stats?.published_count ?? 0} label="publicados" loading={isLoadingStats} C={C} />
          <View style={styles.statsDivider} />
          <StatPill value={stats?.draft_count ?? 0} label="borradores" loading={isLoadingStats} C={C} />
        </View>
        <View style={[styles.statsDivider, styles.statsHDivider]} />
        <View style={styles.metricsRow}>
          <StatPill value={stats?.total_likes ?? 0} label="me gusta" loading={isLoadingStats} C={C} />
          <View style={styles.statsDivider} />
          <StatPill value={stats?.total_views ?? 0} label="lecturas" loading={isLoadingStats} C={C} />
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
        {(['published', 'draft', 'saved'] as ActiveTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabChange(tab)}>
            <Text
              variant="ui"
              style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'published' ? 'Publicados' : tab === 'draft' ? 'Borradores' : 'Guardados'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => {
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
            style={[styles.emptyBtn, { marginTop: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.ink }]}
            onPress={() => router.push('/register')}>
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
        data={poems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.poemCardWrapper}>
            <PoemCard poem={item} />
          </View>
        )}
        ListHeaderComponent={renderProfileHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={C.ink} />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

            <Text variant="ui" style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              placeholderTextColor={C.pencil}
              maxLength={80}
            />

            <Text variant="ui" style={styles.fieldLabel}>Bio</Text>
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
            <Text variant="ui" style={styles.charCount}>{editBio.length}/300</Text>

            <Text variant="ui" style={styles.fieldLabel}>Sitio web</Text>
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

            <Text variant="ui" style={styles.fieldLabel}>Instagram</Text>
            <TextInput
              style={styles.fieldInput}
              value={editInstagram}
              onChangeText={setEditInstagram}
              placeholder="@usuario"
              placeholderTextColor={C.pencil}
              autoCapitalize="none"
              maxLength={60}
            />

            <Text variant="ui" style={styles.fieldLabel}>Twitter / X</Text>
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

// --------------- StatPill ---------------

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
      <Text variant="ui" style={{ fontSize: 10, color: C.pencil, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function formatStatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// --------------- Styles ---------------

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
      fontSize: Typography.fontSize.sm,
      color: C.pencil,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    tabLabelActive: {
      color: C.ink,
    },

    // Poem cards
    poemCardWrapper: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
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
