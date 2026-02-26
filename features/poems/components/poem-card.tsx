import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import type { PoemResponse } from '../types/poem';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/features/auth/store/auth-store';

interface PoemCardProps {
  poem: PoemResponse;
  onLike?: (poemId: string) => void;
  onEmotionTag?: (poemId: string) => void;
}

export function PoemCard({ poem, onLike, onEmotionTag }: PoemCardProps) {
  const { isAuthenticated } = useAuthStore();

  const navigateToDetail = () => {
    router.push(`/poem/${poem.id}`);
  };

  const handleLike = (e: any) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    onLike?.(poem.id);
  };

  const handleEmotion = (e: any) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    onEmotionTag?.(poem.id);
  };

  // Truncate content for preview (max 3 lines approximation)
  const previewContent = poem.content.length > 150 
    ? `${poem.content.substring(0, 150)}...` 
    : poem.content;

  const timeAgo = formatDistanceToNow(new Date(poem.created_at), {
    addSuffix: true,
    locale: es
  });

  return (
    <Pressable onPress={navigateToDetail}>
      <Card className="aspect-[3/4] p-4 flex justify-between">
        {/* Header */}
        <View>
          {/* Title */}
          <Text variant="display" className="text-2xl mb-3 text-ink">
            {poem.title}
          </Text>

          {/* Content Preview */}
          <Text variant="bodyItalic" className="text-base text-ink/80 leading-relaxed">
            {previewContent}
          </Text>
        </View>

        {/* Footer */}
        <View className="space-y-3">
          {/* Author Info */}
          <View className="flex-row items-center space-x-2">
            <View className="w-8 h-8 rounded-full bg-pencil/20 items-center justify-center">
              <Text variant="ui" className="text-xs text-ink">
                {poem.author?.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text variant="uiBold" className="text-xs text-ink">
                {poem.author?.name}
              </Text>
              <Text variant="ui" className="text-xs text-pencil">
                @{poem.author?.username}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center space-x-4">
              {/* Like */}
              <Pressable onPress={handleLike} className="flex-row items-center space-x-1">
                <Text variant="ui" className="text-xs">
                  {poem.is_liked ? '❤️' : '🤍'}
                </Text>
                <Text variant="ui" className="text-xs text-pencil">
                  {poem.like_count}
                </Text>
              </Pressable>

              {/* Views */}
              <View className="flex-row items-center space-x-1">
                <Text variant="ui" className="text-xs">
                  👁️
                </Text>
                <Text variant="ui" className="text-xs text-pencil">
                  {poem.view_count}
                </Text>
              </View>

              {/* Emotion indicator */}
              {poem.user_emotion && (
                <Pressable onPress={handleEmotion}>
                  <Text variant="ui" className="text-xs">
                    {getEmotionEmoji(poem.user_emotion)}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Time */}
            <Text variant="ui" className="text-xs text-pencil">
              {timeAgo}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
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
