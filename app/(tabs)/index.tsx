import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/colors';
import { PoemCard } from '@/features/poems/components/poem-card';
import { usePoemFeed } from '@/features/poems/hooks/use-poem-feed';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useThemedColors } from '@/hooks/use-themed-colors';

type ThemeColors = ReturnType<typeof useThemedColors>;

export default function FeedScreen() {
  const { poems, isLoading, isRefreshing, error, loadFeed, loadMore, refresh, toggleLike, toggleBookmark } =
    usePoemFeed();
  const { isAuthenticated } = useAuthStore();
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  useEffect(() => {
    loadFeed(true);
  }, []);

  const handleCompose = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push('/compose');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>ODA</Text>
      <Pressable
        style={styles.profileBtn}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Ionicons name="person-circle-outline" size={28} color={C.ink} />
      </Pressable>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || poems.length === 0) return null;
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading && poems.length === 0) {
      return (
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={C.ink} />
          <Text variant="ui" style={{ marginTop: 16, color: C.pencil }}>
            Cargando poemas...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centred}>
          <Text variant="ui" style={{ textAlign: 'center', color: C.wax, marginBottom: 8 }}>
            Error al cargar el feed
          </Text>
          <Text variant="ui" style={{ textAlign: 'center', color: C.pencil }}>
            {error}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centred}>
        <Text variant="display" style={{ fontSize: 24, marginBottom: 8, color: C.ink }}>
          Sin poemas aún
        </Text>
        <Text variant="body" style={{ textAlign: 'center', color: C.pencil, marginBottom: 16 }}>
          Sé el primero en compartir tus palabras
        </Text>
        <Pressable onPress={handleCompose} style={[styles.emptyBtn, { backgroundColor: C.ink }]}>
          <Text variant="uiBold" style={{ fontSize: 12, color: C.paper, textTransform: 'uppercase' }}>
            Escribir un poema
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <FlatList
        data={poems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
            <PoemCard poem={item} onLike={toggleLike} onBookmark={toggleBookmark} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={C.ink} />
        }
        contentContainerStyle={{ paddingBottom: Spacing.xl, flexGrow: 1 }}
      />

      {/* FAB — compose */}
      <Pressable onPress={handleCompose} style={styles.fab}>
        <Ionicons name="create-outline" size={28} color={C.surface} />
      </Pressable>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    header: {
      paddingTop: 52,
      paddingBottom: 12,
      paddingHorizontal: Spacing.md,
      backgroundColor: C.paper,
      borderBottomWidth: 1,
      borderBottomColor: C.border.light,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: 'CormorantGaramond_700Bold_Italic',
      fontSize: 32,
      letterSpacing: 8,
      color: C.ink,
      flex: 1,
      textAlign: 'center',
    },
    profileBtn: {
      position: 'absolute',
      right: Spacing.md,
      bottom: 12,
      padding: 4,
    },
    centred: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 80,
    },
    emptyBtn: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: C.wax,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: C.wax,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
  });
}
