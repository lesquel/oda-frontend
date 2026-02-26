import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/colors';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { PoemResponse, EmotionType } from '@/features/poems/types/poem';
import { EmotionSelector } from '@/features/poems/components/emotion-selector';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function PoemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [poem, setPoem] = useState<PoemResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const emotionSheetRef = useRef<BottomSheet>(null);
  const { isAuthenticated } = useAuthStore();

  // Redirect unauthenticated users to login for write actions
  const requireAuth = (cb: () => void) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    cb();
  };

  useEffect(() => {
    loadPoem();
  }, [id]);

  const loadPoem = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await poemsApi.getPoemById(id);
      setPoem(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load poem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = () => requireAuth(async () => {
    if (!poem) return;

    try {
      const isLiked = await poemsApi.toggleLike(poem.id);
      setPoem({
        ...poem,
        is_liked: isLiked,
        like_count: isLiked 
          ? poem.like_count + 1 
          : Math.max(0, poem.like_count - 1),
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  });

  const handleOpenEmotionSelector = () => requireAuth(() => {
    emotionSheetRef.current?.expand();
  });

  const handleSelectEmotion = async (emotion: EmotionType) => {
    if (!poem) return;

    try {
      await poemsApi.tagEmotion(poem.id, emotion);
      
      // Reload poem to get updated emotion counts
      const updatedPoem = await poemsApi.getPoemById(poem.id);
      setPoem(updatedPoem);
    } catch (err) {
      console.error('Failed to tag emotion:', err);
    }
  };

  const handleRemoveEmotion = async () => {
    if (!poem) return;

    try {
      await poemsApi.removeEmotionTag(poem.id);
      
      // Reload poem
      const updatedPoem = await poemsApi.getPoemById(poem.id);
      setPoem(updatedPoem);
    } catch (err) {
      console.error('Failed to remove emotion:', err);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.ink} />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (error || !poem) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
          <Text variant="ui" className="text-center text-wax mb-4">
            {error || 'Poem not found'}
          </Text>
          <Pressable onPress={handleBack}>
            <Text variant="uiBold" className="text-ink">
              Go Back
            </Text>
          </Pressable>
        </View>
      </GestureHandlerRootView>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(poem.created_at), {
    addSuffix: true,
    locale: es
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: Colors.paper }}>
        {/* Header */}
        <View className="pt-12 pb-4 px-4 flex-row items-center justify-between border-b border-pencil/10">
          <Pressable onPress={handleBack} className="p-2">
            <Text variant="ui" className="text-xl">←</Text>
          </Pressable>
          <Text variant="display" className="text-2xl tracking-widest">
            ODA
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          {/* Poem Content */}
          <View className="px-6 py-8">
            {/* Title */}
            <Text variant="display" className="text-3xl mb-6 text-ink text-center">
              {poem.title}
            </Text>

            {/* Content */}
            <Text variant="bodyItalic" className="text-lg text-ink leading-loose mb-8">
              {poem.content}
            </Text>

            {/* Author Info */}
            <View className="flex-row items-center space-x-3 mb-6">
              <View className="w-12 h-12 rounded-full bg-pencil/20 items-center justify-center">
                <Text variant="ui" className="text-base text-ink">
                  {poem.author?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text variant="uiBold" className="text-sm text-ink">
                  {poem.author?.name}
                </Text>
                <Text variant="ui" className="text-sm text-pencil">
                  @{poem.author?.username}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row items-center space-x-6 py-4 border-t border-b border-pencil/10">
              <View className="flex-row items-center space-x-2">
                <Text variant="ui" className="text-sm">
                  {poem.is_liked ? '❤️' : '🤍'}
                </Text>
                <Text variant="ui" className="text-sm text-pencil">
                  {poem.like_count} likes
                </Text>
              </View>
              <View className="flex-row items-center space-x-2">
                <Text variant="ui" className="text-sm">👁️</Text>
                <Text variant="ui" className="text-sm text-pencil">
                  {poem.view_count} views
                </Text>
              </View>
              <Text variant="ui" className="text-sm text-pencil">
                {timeAgo}
              </Text>
            </View>

            {/* Emotion Distribution */}
            {poem.emotion_counts && Object.keys(poem.emotion_counts).length > 0 && (
              <View className="mt-6">
                <Text variant="uiBold" className="text-sm text-ink mb-3">
                  How readers feel:
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {Object.entries(poem.emotion_counts).map(([emotion, count]) => (
                    <View
                      key={emotion}
                      className="flex-row items-center space-x-1 px-3 py-2 bg-surface rounded-full border border-pencil/10"
                    >
                      <Text variant="ui" className="text-sm">
                        {getEmotionEmoji(emotion)}
                      </Text>
                      <Text variant="ui" className="text-sm text-pencil">
                        {count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Bar */}
        <View className="border-t border-pencil/10 bg-paper px-6 py-4 flex-row items-center justify-around">
          <Pressable onPress={handleLike} className="items-center">
            <Text variant="ui" className="text-2xl mb-1">
              {poem.is_liked ? '❤️' : '🤍'}
            </Text>
            <Text variant="ui" className="text-xs text-pencil uppercase">
              Like
            </Text>
          </Pressable>

          <Pressable onPress={handleOpenEmotionSelector} className="items-center">
            <Text variant="ui" className="text-2xl mb-1">
              {poem.user_emotion ? getEmotionEmoji(poem.user_emotion) : '💭'}
            </Text>
            <Text variant="ui" className="text-xs text-pencil uppercase">
              Feel
            </Text>
          </Pressable>

          <Pressable className="items-center opacity-50">
            <Text variant="ui" className="text-2xl mb-1">📤</Text>
            <Text variant="ui" className="text-xs text-pencil uppercase">
              Share
            </Text>
          </Pressable>

          <Pressable className="items-center opacity-50">
            <Text variant="ui" className="text-2xl mb-1">🔖</Text>
            <Text variant="ui" className="text-xs text-pencil uppercase">
              Save
            </Text>
          </Pressable>
        </View>

        {/* Emotion Selector Bottom Sheet */}
        <EmotionSelector
          ref={emotionSheetRef}
          selectedEmotion={poem.user_emotion}
          onSelect={handleSelectEmotion}
          onRemove={poem.user_emotion ? handleRemoveEmotion : undefined}
        />
      </View>
    </GestureHandlerRootView>
  );
}

function getEmotionEmoji(emotion: string): string {
  const emojiMap: Record<string, string> = {
    melancholic: '😔',
    hopeful: '🌟',
    serene: '☮️',
    passionate: '🔥',
    nostalgic: '🍂',
    inspiring: '✨',
  };
  return emojiMap[emotion] || '💭';
}
