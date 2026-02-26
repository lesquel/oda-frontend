import { View, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { PoemStatus } from '@/features/poems/types/poem';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function ComposeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const { isAuthenticated } = useAuthStore();
  // Guard: unauthenticated users are sent to login
  if (!isAuthenticated) return <Redirect href="/login" />;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PoemStatus>('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadPoem();
    }
  }, [id]);

  const loadPoem = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const poem = await poemsApi.getPoemById(id);
      setTitle(poem.title);
      setContent(poem.content);
      setStatus(poem.status);
    } catch (err: any) {
      setError(err.message || 'Failed to load poem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (saveStatus: PoemStatus) => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (isEditing && id) {
        await poemsApi.updatePoem(id, {
          title: title.trim(),
          content: content.trim(),
          status: saveStatus,
        });
      } else {
        await poemsApi.createPoem({
          title: title.trim(),
          content: content.trim(),
          status: saveStatus,
        });
      }

      // Navigate back to feed
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save poem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.ink} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={{ flex: 1, backgroundColor: Colors.paper }}>
        {/* Header */}
        <View className="pt-12 pb-4 px-4 flex-row items-center justify-between border-b border-pencil/10">
          <Pressable onPress={handleCancel} disabled={isSaving}>
            <Text variant="uiBold" className="text-sm text-pencil uppercase">
              Cancel
            </Text>
          </Pressable>
          
          <Text variant="display" className="text-2xl tracking-widest">
            {isEditing ? 'Edit' : 'Compose'}
          </Text>

          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => handleSave('draft')}
              disabled={isSaving}
              className="px-3 py-1.5 bg-surface rounded-md border border-pencil/20"
            >
              <Text variant="uiBold" className="text-xs text-ink uppercase">
                Draft
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error Message */}
          {error && (
            <View className="mb-4 p-4 bg-wax/10 rounded-lg border border-wax/30">
              <Text variant="ui" className="text-sm text-wax">
                {error}
              </Text>
            </View>
          )}

          {/* Title Input */}
          <View className="mb-6">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Untitled Poem"
              placeholderTextColor={Colors.pencil}
              editable={!isSaving}
              multiline
              style={{
                fontFamily: Typography.fontFamily.display,
                fontSize: 32,
                lineHeight: 42,
                color: Colors.ink,
                padding: 0,
                minHeight: 50,
              }}
            />
          </View>

          {/* Content Input */}
          <View className="flex-1">
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Let your words flow..."
              placeholderTextColor={Colors.pencil}
              editable={!isSaving}
              multiline
              textAlignVertical="top"
              style={{
                fontFamily: Typography.fontFamily.bodyItalic,
                fontSize: 18,
                lineHeight: 32,
                color: Colors.ink,
                padding: 0,
                minHeight: 400,
              }}
            />
          </View>

          {/* Word Count */}
          <View className="mt-6 flex-row justify-between items-center">
            <Text variant="ui" className="text-xs text-pencil">
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </Text>
            <Text variant="ui" className="text-xs text-pencil">
              {content.length} characters
            </Text>
          </View>
        </ScrollView>

        {/* Publish Button */}
        <View className="border-t border-pencil/10 bg-paper px-6 py-4">
          <Pressable
            onPress={() => handleSave('published')}
            disabled={isSaving || !title.trim() || !content.trim()}
            className={`py-4 rounded-lg items-center ${
              isSaving || !title.trim() || !content.trim()
                ? 'bg-pencil/20'
                : 'bg-ink'
            }`}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.paper} />
            ) : (
              <Text variant="uiBold" className="text-sm text-paper uppercase tracking-wider">
                {isEditing ? 'Update Poem' : 'Publish Poem'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
