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
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { PoemCard } from '@/features/poems/components/poem-card';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { usersApi, UserStats } from '@/features/users/services/users-api';
import type { Poem } from '@/features/poems/types/poem';
import { Colors, Typography, Spacing } from '@/constants/colors';

type ActiveTab = 'published' | 'draft';

export default function ProfileScreen() {
  const { user, isLoading: authLoading, updateProfile } = useAuthStore();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('published');
  const [isLoadingPoems, setIsLoadingPoems] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
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
      // Stats not critical, silently fail
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  const loadPoems = useCallback(
    async (tab: ActiveTab = activeTab) => {
      if (!user) return;
      try {
        setIsLoadingPoems(true);
        const data = await usersApi.getUserPoems(user.id, tab);
        setPoems(data);
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
      await updateProfile({ name: editName.trim(), bio: editBio.trim() });
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
        <Pressable style={styles.editBtn} onPress={openEdit}>
          <Text variant="ui" style={styles.editBtnText}>
            Editar
          </Text>
        </Pressable>
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
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatPill
          value={stats?.published_count ?? 0}
          label="publicados"
          loading={isLoadingStats}
        />
        <View style={styles.statsDivider} />
        <StatPill
          value={stats?.total_likes ?? 0}
          label="me gusta"
          loading={isLoadingStats}
        />
        <View style={styles.statsDivider} />
        <StatPill
          value={stats?.total_views ?? 0}
          label="lecturas"
          loading={isLoadingStats}
        />
      </View>

      {/* Compose CTA */}
      <Pressable
        style={styles.composeCta}
        onPress={() => router.push('/compose')}>
        <Text variant="ui" style={styles.composeCtaText}>
          ✍️  Escribir poema
        </Text>
      </Pressable>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === 'published' && styles.tabActive]}
          onPress={() => handleTabChange('published')}>
          <Text
            variant="ui"
            style={[
              styles.tabLabel,
              activeTab === 'published' && styles.tabLabelActive,
            ]}>
            Publicados
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'draft' && styles.tabActive]}
          onPress={() => handleTabChange('draft')}>
          <Text
            variant="ui"
            style={[
              styles.tabLabel,
              activeTab === 'draft' && styles.tabLabelActive,
            ]}>
            Borradores
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoadingPoems) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.ink} />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Text variant="body" style={styles.emptyText}>
          {activeTab === 'published'
            ? 'Aún no has publicado ningún poema'
            : 'No tienes borradores guardados'}
        </Text>
        <Pressable
          style={styles.emptyBtn}
          onPress={() => router.push('/compose')}>
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
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push('/login')}>
            <Text variant="ui" style={styles.emptyBtnText}>
              Iniciar sesión
            </Text>
          </Pressable>
          <Pressable
            style={[styles.emptyBtn, { marginTop: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.ink }]}
            onPress={() => router.push('/register')}>
            <Text variant="ui" style={[styles.emptyBtnText, { color: Colors.ink }]}>
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
      <FlatList<Poem>
        data={poems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.poemCardWrapper}>
            <PoemCard
              poem={{ ...item, is_liked: false }}
            />
          </View>
        )}
        ListHeaderComponent={renderProfileHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.ink}
          />
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
                <ActivityIndicator color={Colors.wax} size="small" />
              ) : (
                <Text variant="uiBold" style={styles.modalSave}>
                  Guardar
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled">
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
              placeholderTextColor={Colors.pencil}
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
              placeholderTextColor={Colors.pencil}
              multiline
              numberOfLines={4}
              maxLength={240}
            />
            <Text variant="ui" style={styles.charCount}>
              {editBio.length}/240
            </Text>
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
}: {
  value: number;
  label: string;
  loading: boolean;
}) {
  return (
    <View style={styles.statPill}>
      {loading ? (
        <ActivityIndicator color={Colors.ink} size="small" />
      ) : (
        <Text variant="display" style={styles.statValue}>
          {formatStatNumber(value)}
        </Text>
      )}
      <Text variant="ui" style={styles.statLabel}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
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
    borderBottomColor: Colors.border.light,
  },
  appTitle: {
    fontSize: Typography.fontSize['3xl'],
    letterSpacing: 8,
    color: Colors.ink,
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  editBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.ink,
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
    backgroundColor: Colors.wax,
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
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: Typography.fontSize.lg,
    color: Colors.pencil,
    marginBottom: Spacing.sm,
  },
  bio: {
    fontSize: Typography.fontSize.lg,
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.relaxed,
    maxWidth: 280,
  },
  bioPlaceholder: {
    fontSize: Typography.fontSize.base,
    color: Colors.pencil,
    textDecorationLine: 'underline',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.light,
    marginHorizontal: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.ink,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.pencil,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: Colors.border.medium,
  },

  // Compose CTA
  composeCta: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
    backgroundColor: Colors.ink,
    alignItems: 'center',
  },
  composeCtaText: {
    color: Colors.surface,
    fontSize: Typography.fontSize.base,
    letterSpacing: 1,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
    borderBottomColor: Colors.ink,
  },
  tabLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.pencil,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tabLabelActive: {
    color: Colors.ink,
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
    color: Colors.pencil,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  emptyBtnText: {
    color: Colors.ink,
    fontSize: Typography.fontSize.sm,
  },

  // Edit modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    color: Colors.pencil,
  },
  modalSave: {
    fontSize: Typography.fontSize.base,
    color: Colors.wax,
  },
  modalBody: {
    flex: 1,
    padding: Spacing.md,
  },
  modalError: {
    color: Colors.wax,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.pencil,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.ink,
    backgroundColor: Colors.surface,
  },
  fieldInputMultiline: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm + 2,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.pencil,
    textAlign: 'right',
    marginTop: 4,
  },
});
