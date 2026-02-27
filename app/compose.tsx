import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Typography } from '@/constants/colors';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { PoemStatus } from '@/features/poems/types/poem';
import { useAuthStore } from '@/features/auth/store/auth-store';

export default function ComposeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Redirect href="/login" />;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PoemStatus>('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) loadPoem();
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
      setError(err.message || 'No se pudo cargar el poema');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (saveStatus: PoemStatus) => {
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    if (!content.trim() || content.trim().length < 10) {
      setError('El poema debe tener al menos 10 caracteres');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      if (isEditing && id) {
        await poemsApi.updatePoem(id, { title: title.trim(), content: content.trim(), status: saveStatus });
      } else {
        await poemsApi.createPoem({ title: title.trim(), content: content.trim(), status: saveStatus });
      }
      router.back();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const canPublish = !isSaving && title.trim().length > 0 && content.trim().length >= 10;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.ink} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} disabled={isSaving} hitSlop={8}>
            <Ionicons name="close" size={22} color={Colors.pencil} />
          </Pressable>

          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar' : 'Componer'}
          </Text>

          <Pressable
            onPress={() => handleSave('draft')}
            disabled={isSaving || !title.trim()}
            style={[styles.draftBtn, (!title.trim() || isSaving) && { opacity: 0.4 }]}
          >
            <Text style={styles.draftBtnText}>Borrador</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.wax} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Title input */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título del poema…"
            placeholderTextColor={`${Colors.pencil}80`}
            editable={!isSaving}
            multiline
            style={styles.titleInput}
          />

          {/* Decorative rule */}
          <View style={styles.rule} />

          {/* Content input */}
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={"Deja que las palabras fluyan…\n\nNaturaleza verde es dorada,\nsu matiz más difícil de retener."}
            placeholderTextColor={`${Colors.pencil}60`}
            editable={!isSaving}
            multiline
            textAlignVertical="top"
            style={styles.contentInput}
          />
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.wordCount}>{wordCount} palabras</Text>

          <Pressable
            onPress={() => handleSave('published')}
            disabled={!canPublish}
            style={[styles.publishBtn, !canPublish && styles.publishBtnDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.surface} size="small" />
            ) : (
              <>
                <Ionicons name="send" size={14} color={Colors.surface} />
                <Text style={styles.publishBtnText}>
                  {isEditing ? 'Actualizar' : 'Publicar'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paper },
  centered: { flex: 1, backgroundColor: Colors.paper, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.paper,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 22,
    letterSpacing: 4,
    color: Colors.ink,
  },
  draftBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.medium,
  },
  draftBtnText: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 11,
    color: Colors.pencil,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
    padding: Spacing.sm + 4,
    backgroundColor: `${Colors.wax}12`,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${Colors.wax}40`,
  },
  errorText: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 12,
    color: Colors.wax,
    flex: 1,
  },

  titleInput: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 32,
    lineHeight: 42,
    color: Colors.ink,
    padding: 0,
    marginBottom: Spacing.md,
    minHeight: 50,
  },

  rule: {
    height: 1,
    backgroundColor: Colors.pencil,
    opacity: 0.15,
    marginBottom: Spacing.lg,
  },

  contentInput: {
    fontFamily: Typography.fontFamily.bodyItalic,
    fontSize: 18,
    lineHeight: 34,
    color: Colors.ink,
    padding: 0,
    minHeight: 320,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.paper,
  },
  wordCount: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 11,
    color: Colors.pencil,
    letterSpacing: 0.5,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.wax,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 20,
  },
  publishBtnDisabled: {
    backgroundColor: Colors.pencil,
    opacity: 0.4,
  },
  publishBtnText: {
    fontFamily: Typography.fontFamily.uiBold,
    fontSize: 12,
    color: Colors.surface,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
