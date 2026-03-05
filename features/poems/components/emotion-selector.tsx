import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Spacing, Typography } from '@/constants/colors';
import { useThemedColors } from '@/hooks/use-themed-colors';
import { poemsApi } from '../services/poems-api';
import type { EmotionType } from '../types/poem';

type ThemeColors = ReturnType<typeof useThemedColors>;

interface EmotionOption {
  id: string;
  type: EmotionType;
  label: string;
  emoji: string;
  description: string;
}

const FALLBACK_EMOTIONS: EmotionOption[] = [
  { id: '', type: 'melancholic', label: 'Melancólico',  emoji: '😔', description: 'Tristeza reflexiva, contemplación profunda' },
  { id: '', type: 'hopeful',     label: 'Esperanzador', emoji: '🌟', description: 'Optimista, mirando hacia adelante' },
  { id: '', type: 'serene',      label: 'Sereno',        emoji: '☮️', description: 'Paz, calma, tranquilidad' },
  { id: '', type: 'passionate',  label: 'Apasionado',   emoji: '🔥', description: 'Emoción intensa, fervoroso' },
  { id: '', type: 'nostalgic',   label: 'Nostálgico',   emoji: '🍂', description: 'Anhelo del pasado, melancolía' },
  { id: '', type: 'inspiring',   label: 'Inspirador',   emoji: '✨', description: 'Edificante, motivador' },
];

export interface EmotionSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedEmotion?: EmotionType;
  onSelect: (emotionId: string, emotion: EmotionType) => void;
  onRemove?: () => void;
}

export function EmotionSelector({
  visible,
  onClose,
  selectedEmotion,
  onSelect,
  onRemove,
}: EmotionSelectorProps) {
  const C = useThemedColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [emotions, setEmotions] = useState<EmotionOption[]>(FALLBACK_EMOTIONS);

  // Load catalog from backend when the modal first opens
  useEffect(() => {
    if (!visible) return;
    poemsApi.getEmotionCatalog()
      .then((catalog) => {
        if (catalog && catalog.length > 0) {
          setEmotions(
            catalog.map((e) => ({
              id: e.id,
              type: ((e as any).slug ?? (e as any).name) as EmotionType,
              label: (e as any).label ?? (e as any).name,
              emoji: e.emoji,
              description: e.description,
            }))
          );
        }
      })
      .catch(() => {
        // keep fallback list
      });
  }, [visible]);

  const handleSelect = (emotion: EmotionOption) => {
    onSelect(emotion.id || emotion.type, emotion.type);
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <Text style={styles.sheetTitle}>¿Qué sientes al leerlo?</Text>
              <Text style={styles.sheetSubtitle}>Comparte tu reacción</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {emotions.map((emotion) => {
                  const isSelected = selectedEmotion === emotion.type;
                  return (
                    <Pressable
                      key={emotion.type}
                      onPress={() => handleSelect(emotion)}
                      style={[styles.emotionItem, isSelected && styles.emotionItemSelected]}
                    >
                      <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                      <View style={styles.emotionInfo}>
                        <Text style={[styles.emotionLabel, isSelected && styles.emotionLabelSelected]}>
                          {emotion.label}
                        </Text>
                        <Text style={styles.emotionDesc}>{emotion.description}</Text>
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </Pressable>
                  );
                })}

                {onRemove && selectedEmotion && (
                  <Pressable onPress={handleRemove} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Quitar reacción</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: `${C.ink}73`,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: C.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl + 16,
      paddingTop: Spacing.md,
      maxHeight: '72%' as any,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.pencil,
      opacity: 0.35,
      alignSelf: 'center',
      marginBottom: Spacing.md,
    },
    sheetTitle: {
      fontFamily: Typography.fontFamily.display,
      fontSize: 22,
      color: C.ink,
      textAlign: 'center',
      marginBottom: 4,
    },
    sheetSubtitle: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 11,
      color: C.pencil,
      textAlign: 'center',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: Spacing.lg,
    },
    emotionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border.light,
    },
    emotionItemSelected: {
      borderColor: C.wax,
      backgroundColor: `${C.wax}18`,
    },
    emotionEmoji: {
      fontSize: 26,
      marginRight: Spacing.md,
    },
    emotionInfo: {
      flex: 1,
    },
    emotionLabel: {
      fontFamily: Typography.fontFamily.uiBold,
      fontSize: 13,
      color: C.ink,
      marginBottom: 2,
    },
    emotionLabelSelected: {
      color: C.wax,
    },
    emotionDesc: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 11,
      color: C.pencil,
    },
    checkmark: {
      color: C.wax,
      fontSize: 16,
    },
    removeBtn: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: C.border.light,
    },
    removeBtnText: {
      fontFamily: Typography.fontFamily.ui,
      fontSize: 13,
      color: C.wax,
    },
  });
}
