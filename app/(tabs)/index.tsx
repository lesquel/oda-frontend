import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Text } from '@/components/ui';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function FeedScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.paper }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 48,
          paddingBottom: 16,
          paddingHorizontal: Spacing.lg,
          backgroundColor: `${Colors.paper}95`,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border.light,
        }}
      >
        <Text
          variant="display"
          style={{
            fontSize: 36,
            textAlign: 'center',
            letterSpacing: 2,
          }}
        >
          ODA
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          gap: Spacing.lg,
        }}
      >
        {/* Welcome Card */}
        <Card variant="elevated" style={{ padding: Spacing.xl }}>
          <Text variant="display" style={{ fontSize: Typography.fontSize['2xl'], marginBottom: Spacing.sm }}>
            Welcome, {user?.name}! ✨
          </Text>
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
