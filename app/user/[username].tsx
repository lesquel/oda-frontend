import {
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Linking,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { PoemCard } from '@/features/poems/components/poem-card';
import { usersApi, PublicUserProfile } from '@/features/users/services/users-api';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { PoemResponse } from '@/features/poems/types/poem';
import { Typography, Spacing } from '@/constants/colors';
import { shareContent } from '@/utils/share';
import { useThemedColors } from '@/hooks/use-themed-colors';

type ThemeColors = ReturnType<typeof useThemedColors>;

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [poems, setPoems] = useState<PoemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileData = await usersApi.getPublicProfile(username as string);
      setProfile(profileData);

      try {
        const poemsData = await usersApi.getUserPoems(profileData.id, 'published');
        setPoems(poemsData as PoemResponse[]);
      } catch {
        setPoems([]);
      }
    } catch (err: any) {
      setError('Perfil no encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (!profile) return;
    const url = `https://oda.app/user/${profile.username}`;
    const msg = `${profile.name} (@${profile.username}) en Oda — ${url}`;
    shareContent({ title: profile.name, text: msg });
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.ink} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centeredFull}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </Pressable>
          <Text variant="body" style={{ color: C.pencil, textAlign: 'center' }}>
            {error ?? 'Perfil no encontrado'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </Pressable>
        <Text variant="display" style={styles.navTitle}>ODA</Text>
        <Pressable onPress={handleShare} style={styles.shareBtn} hitSlop={8}>
          <Ionicons name="share-outline" size={22} color={C.ink} />
        </Pressable>
      </View>

      {/* Hero */}
      <View style={styles.heroSection}>
        <View style={styles.avatarCircle}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text variant="display" style={styles.avatarText}>
              {initials(profile.name || profile.username)}
            </Text>
          )}
        </View>
        <Text variant="display" style={styles.displayName}>
          {profile.name}
        </Text>
        <Text variant="body" style={styles.username}>
          @{profile.username}
        </Text>
        {profile.bio ? (
          <Text variant="bodyItalic" style={styles.bio}>
            {profile.bio}
          </Text>
        ) : null}

        {/* Social links */}
        <View style={styles.socialRow}>
          {profile.website ? (
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL(
                profile.website!.startsWith('http') ? profile.website! : `https://${profile.website}`
              )}>
              <Ionicons name="globe-outline" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText} numberOfLines={1}>
                {profile.website.replace(/^https?:\/\//, '')}
              </Text>
            </Pressable>
          ) : null}
          {profile.instagram ? (
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL(`https://instagram.com/${profile.instagram}`)}>
              <Ionicons name="logo-instagram" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText}>
                @{profile.instagram}
              </Text>
            </Pressable>
          ) : null}
          {profile.twitter ? (
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL(`https://x.com/${profile.twitter}`)}>
              <Ionicons name="logo-twitter" size={14} color={C.wax} />
              <Text variant="ui" style={styles.socialLinkText}>
                @{profile.twitter}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.poemsHeader}>
        <Text variant="ui" style={styles.poemsHeaderText}>POEMAS</Text>
        <View style={styles.poemsHeaderLine} />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.centered}>
      <Text variant="body" style={{ color: C.pencil, textAlign: 'center' }}>
        Este poeta aún no ha publicado nada
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList<PoemResponse>
        data={poems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <PoemCard poem={item} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.paper,
    },
    listContent: {
      paddingBottom: Spacing['2xl'],
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['2xl'],
      paddingHorizontal: Spacing.lg,
    },
    centeredFull: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      gap: 16,
    },

    // Nav bar
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border.light,
    },
    navTitle: {
      fontSize: Typography.fontSize['2xl'],
      letterSpacing: 8,
      color: C.ink,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Hero
    heroSection: {
      alignItems: 'center',
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
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
      fontSize: Typography.fontSize.xl,
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
      lineHeight: Typography.fontSize.base * 1.7,
      maxWidth: 300,
      marginBottom: Spacing.sm,
    },
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

    // Poems section header
    poemsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      gap: 12,
    },
    poemsHeaderText: {
      fontSize: Typography.fontSize.xs,
      color: C.pencil,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    poemsHeaderLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border.light,
    },

    // Poem cards
    cardWrapper: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
  });
}
