import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/colors';
import { PoemCard } from '@/features/poems/components/poem-card';
import { usePoemFeed } from '@/features/poems/hooks/use-poem-feed';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function FeedScreen() {
    const { poems, isLoading, isRefreshing, error, loadFeed, loadMore, refresh, toggleLike, toggleBookmark } =
    usePoemFeed();
  const { isAuthenticated } = useAuthStore();

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
        <Ionicons name="person-circle-outline" size={28} color={Colors.ink} />
      </Pressable>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || poems.length === 0) return null;
    return (
      <View className="py-4">
        <ActivityIndicator color={Colors.ink} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading && poems.length === 0) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color={Colors.ink} />
          <Text variant="ui" className="mt-4 text-pencil">
            Cargando poemas...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center py-20 px-4">
          <Text variant="ui" className="text-center text-wax mb-2">
            Error al cargar el feed
          </Text>
          <Text variant="ui" className="text-center text-pencil">
            {error}
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <Text variant="display" className="text-2xl mb-2 text-ink">
          Sin poemas aún
        </Text>
        <Text variant="body" className="text-center text-pencil mb-4">
          Sé el primero en compartir tus palabras
        </Text>
        <Pressable onPress={handleCompose} className="px-6 py-3 bg-ink rounded-lg">
          <Text variant="uiBold" className="text-sm text-paper uppercase">
            Escribir un poema
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.paper }}>
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
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.ink} />
        }
        contentContainerStyle={{ paddingBottom: Spacing.xl, flexGrow: 1 }}
      />

      {/* FAB */}
      <Pressable onPress={handleCompose} style={styles.fab}>
        <Ionicons name="create-outline" size={28} color={Colors.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140,134,125,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_700Bold_Italic',
    fontSize: 32,
    letterSpacing: 8,
    color: Colors.ink,
    flex: 1,
    textAlign: 'center',
  },
  profileBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 12,
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.wax,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.wax,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
