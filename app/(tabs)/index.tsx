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
import { Text } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/colors';
import { PoemCard } from '@/features/poems/components/poem-card';
import { usePoemFeed } from '@/features/poems/hooks/use-poem-feed';

export default function FeedScreen() {
  const {
    poems,
    isLoading,
    isRefreshing,
    error,
    loadFeed,
    loadMore,
    refresh,
    toggleLike,
  } = usePoemFeed();

  useEffect(() => {
    loadFeed(true);
  }, []);

  const renderHeader = () => (
    <View className="pt-12 pb-4 px-4 bg-paper/95 border-b border-pencil/10">
      <Text variant="display" className="text-4xl text-center tracking-widest">
        ODA
      </Text>
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
        <Pressable
          onPress={() => router.push('/compose')}
          className="px-6 py-3 bg-ink rounded-lg">
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
            <PoemCard poem={item} onLike={toggleLike} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.ink}
          />
        }
        contentContainerStyle={{ paddingBottom: Spacing.xl, flexGrow: 1 }}
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/compose')}
        style={styles.fab}>
        <Text className="text-3xl">✍️</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
