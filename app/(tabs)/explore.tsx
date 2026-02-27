import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { PoemCard } from '@/features/poems/components/poem-card';
import { poemsApi } from '@/features/poems/services/poems-api';
import type { PoemResponse, PublicUserProfile, EmotionType } from '@/features/poems/types/poem';
import { Colors, Typography, Spacing, Shadows } from '@/constants/colors';

type SearchTab = 'poems' | 'people' | 'emotions';

const EMOTIONS: { key: EmotionType; label: string; emoji: string }[] = [
  { key: 'melancholic', label: 'Melancólico',  emoji: '😔' },
  { key: 'hopeful',     label: 'Esperanzador', emoji: '🌟' },
  { key: 'serene',      label: 'Sereno',        emoji: '☮️' },
  { key: 'passionate',  label: 'Apasionado',    emoji: '🔥' },
  { key: 'nostalgic',   label: 'Nostálgico',    emoji: '🍂' },
  { key: 'inspiring',   label: 'Inspirador',    emoji: '✨' },
];

export default function ExploreScreen() {
  const [tab, setTab] = useState<SearchTab>('poems');
  const [query, setQuery] = useState('');
  const [poems, setPoems] = useState<PoemResponse[]>([]);
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [emotionPoems, setEmotionPoems] = useState<PoemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string, currentTab: SearchTab) => {
    if (!q.trim()) {
      setPoems([]);
      setUsers([]);
      return;
    }
    setIsLoading(true);
    try {
      if (currentTab === 'poems') {
        const results = await poemsApi.searchPoems(q);
        setPoems(results);
      } else if (currentTab === 'people') {
        const results = await poemsApi.searchUsers(q);
        setUsers(results);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(text, tab);
    }, 400);
  };

  const handleTabChange = (newTab: SearchTab) => {
    setTab(newTab);
    setPoems([]);
    setUsers([]);
    if (newTab !== 'emotions') {
      runSearch(query, newTab);
    }
  };

  const handleEmotionSelect = async (emotion: EmotionType) => {
    const same = selectedEmotion === emotion;
    setSelectedEmotion(same ? null : emotion);
    if (same) { setEmotionPoems([]); return; }
    setIsLoading(true);
    try {
      const results = await poemsApi.searchPoems('', emotion, 30);
      setEmotionPoems(results);
    } catch {
      setEmotionPoems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: PublicUserProfile }) => (
    <Pressable
      style={styles.userRow}
      onPress={() => router.push(`/profile/${item.username}` as any)}>
      <View style={styles.avatarCircle}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarInitial}>
            {(item.name || item.username).charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || item.username}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
        {item.bio ? (
          <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.pencil} />
    </Pressable>
  );

  const poemData = tab === 'emotions' ? emotionPoems : poems;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.pencil} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleQueryChange}
          placeholder={
            tab === 'poems'   ? 'Buscar poemas…'   :
            tab === 'people'  ? 'Buscar personas…' :
                                'Elige una emoción…'
          }
          placeholderTextColor={Colors.pencil}
          editable={tab !== 'emotions'}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setPoems([]); setUsers([]); }}>
            <Ionicons name="close-circle" size={18} color={Colors.pencil} />
          </Pressable>
        )}
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        {(['poems', 'people', 'emotions'] as SearchTab[]).map((t) => {
          const labels: Record<SearchTab, string> = {
            poems:    'Poemas',
            people:   'Personas',
            emotions: 'Emociones',
          };
          return (
            <Pressable
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => handleTabChange(t)}>
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {labels[t]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.ink} />
        </View>
      ) : tab === 'emotions' ? (
        <FlatList
          data={emotionPoems}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.emotionGrid}>
              {EMOTIONS.map((e) => (
                <Pressable
                  key={e.key}
                  style={[
                    styles.emotionChip,
                    selectedEmotion === e.key && styles.emotionChipActive,
                  ]}
                  onPress={() => handleEmotionSelect(e.key)}>
                  <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                  <Text style={[
                    styles.emotionLabel,
                    selectedEmotion === e.key && styles.emotionLabelActive,
                  ]}>
                    {e.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <PoemCard poem={item} />
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            selectedEmotion ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>Sin poemas para esta emoción</Text>
              </View>
            ) : null
          }
        />
      ) : tab === 'people' ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {query.trim() ? `Sin resultados para "${query}"` : 'Escribe un nombre para buscar'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={poemData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <PoemCard poem={item} />
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {query.trim() ? `Sin resultados para "${query}"` : 'Escribe para buscar poemas'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paper },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 30,
    color: Colors.ink,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.lift,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.ui,
    fontSize: 14,
    color: Colors.ink,
  },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  tabLabel: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.pencil,
  },
  tabLabelActive: {
    color: Colors.paper,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 13,
    color: Colors.pencil,
    textAlign: 'center',
  },

  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadows.lift,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  avatar: { width: 44, height: 44 },
  avatarInitial: {
    fontFamily: Typography.fontFamily.uiBold,
    fontSize: 18,
    color: Colors.ink,
  },
  userInfo: { flex: 1 },
  userName: {
    fontFamily: Typography.fontFamily.uiBold,
    fontSize: 13,
    color: Colors.ink,
  },
  userHandle: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 11,
    color: Colors.pencil,
    marginTop: 1,
  },
  userBio: {
    fontFamily: Typography.fontFamily.bodyItalic,
    fontSize: 12,
    color: Colors.pencil,
    marginTop: 2,
  },

  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  emotionChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  emotionEmoji: { fontSize: 16 },
  emotionLabel: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 12,
    color: Colors.ink,
  },
  emotionLabelActive: {
    color: Colors.paper,
  },
});
