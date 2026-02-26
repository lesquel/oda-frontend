import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
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
    hasMore,
    loadFeed,
    loadMore,
    refresh,
    toggleLike,
  } = usePoemFeed();

  // Load initial feed
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
            Loading poems...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center py-20 px-4">
          <Text variant="ui" className="text-center text-wax mb-2">
            Error loading feed
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
          No poems yet
        </Text>
        <Text variant="body" className="text-center text-pencil">
          Be the first to share your words
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.paper }}>
      {renderHeader()}
      
      <FlatList
        data={poems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pt-4 first:pt-0">
            <PoemCard poem={item} onLike={toggleLike} />
          </View>
        )}
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
        contentContainerStyle={{
          paddingBottom: Spacing.xl,
          flexGrow: 1,
        }}
      />
    </View>
  );
}
          <Text variant="body" color="secondary" style={{ fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base }}>
            The Anthology (Feed) will be implemented in Phase 2. For now, you can test the authentication flow.
          </Text>
          <View style={{ marginTop: Spacing.lg }}>
            <Text variant="ui" color="secondary" style={{ fontSize: Typography.fontSize.xs, marginBottom: Spacing.xs }}>
              YOUR ACCOUNT
            </Text>
            <Text variant="body" style={{ fontSize: Typography.fontSize.base }}>
              @{user?.username}
            </Text>
            <Text variant="body" color="secondary" style={{ fontSize: Typography.fontSize.sm }}>
              {user?.email}
            </Text>
          </View>
        </Card>

        {/* Coming Soon Card */}
        <Card variant="elevated" style={{ padding: Spacing.xl }}>
          <Text
            variant="display"
            style={{
              fontSize: Typography.fontSize.xl,
              marginBottom: Spacing.md,
              textAlign: 'center',
            }}
          >
            📖 Coming Soon
          </Text>
          <Text
            variant="body"
            color="secondary"
            style={{
              fontSize: Typography.fontSize.base,
              lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
              textAlign: 'center',
            }}
          >
            • Poem feed with infinite scroll{'\n'}
            • Create and publish poetry{'\n'}
            • React with emotions{'\n'}
            • View poet profiles{'\n'}
            • Analytics dashboard
          </Text>
        </Card>

        {/* Logout */}
        <Button variant="secondary" onPress={handleLogout}>
          Logout
        </Button>
      </ScrollView>
    </View>
  );
}
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
