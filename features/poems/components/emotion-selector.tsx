import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Colors, Spacing, Typography } from '@/constants/colors';
import type { EmotionType } from '../types/poem';

interface EmotionOption {
  type: EmotionType;
  label: string;
  emoji: string;
  description: string;
}

const EMOTIONS: EmotionOption[] = [
  { type: 'melancholic', label: 'Melancólico',  emoji: '😔', description: 'Tristeza reflexiva, contemplación profunda' },
  { type: 'hopeful',     label: 'Esperanzador', emoji: '🌟', description: 'Optimista, mirando hacia adelante' },
  { type: 'serene',      label: 'Sereno',        emoji: '☮️', description: 'Paz, calma, tranquilidad' },
  { type: 'passionate',  label: 'Apasionado',   emoji: '🔥', description: 'Emoción intensa, fervoroso' },
  { type: 'nostalgic',   label: 'Nostálgico',   emoji: '🍂', description: 'Anhelo del pasado, melancolía' },
  { type: 'inspiring',   label: 'Inspirador',   emoji: '✨', description: 'Edificante, motivador' },
];

export interface EmotionSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedEmotion?: EmotionType;
  onSelect: (emotion: EmotionType) => void;
  onRemove?: () => void;
}

export function EmotionSelector({
  visible,
  onClose,
  selectedEmotion,
  onSelect,
  onRemove,
}: EmotionSelectorProps) {
  const handleSelect = (emotion: EmotionType) => {
    onSelect(emotion);
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
                {EMOTIONS.map((emotion) => {
                  const isSelected = selectedEmotion === emotion.type;
                  return (
                    <Pressable
                      key={emotion.type}
                      onPress={() => handleSelect(emotion.type)}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 16,
    paddingTop: Spacing.md,
    maxHeight: '72%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.pencil,
    opacity: 0.35,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 22,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 11,
    color: Colors.pencil,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  emotionItemSelected: {
    borderColor: Colors.wax,
    backgroundColor: '#A8443818',
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
    color: Colors.ink,
    marginBottom: 2,
  },
  emotionLabelSelected: {
    color: Colors.wax,
  },
  emotionDesc: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 11,
    color: Colors.pencil,
  },
  checkmark: {
    color: Colors.wax,
    fontSize: 16,
  },
  removeBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E0D6',
  },
  removeBtnText: {
    fontFamily: Typography.fontFamily.ui,
    fontSize: 13,
    color: Colors.wax,
  },
});
