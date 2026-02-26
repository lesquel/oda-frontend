import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { Text } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/colors';
import type { EmotionType } from '../types/poem';

interface EmotionOption {
  type: EmotionType;
  label: string;
  emoji: string;
  description: string;
}

const EMOTIONS: EmotionOption[] = [
  {
    type: 'melancholic',
    label: 'Melancholic',
    emoji: '😔',
    description: 'Reflective sadness, deep contemplation',
  },
  {
    type: 'hopeful',
    label: 'Hopeful',
    emoji: '🌟',
    description: 'Optimistic, looking forward',
  },
  {
    type: 'serene',
    label: 'Serene',
    emoji: '☮️',
    description: 'Peaceful, calm, tranquil',
  },
  {
    type: 'passionate',
    label: 'Passionate',
    emoji: '🔥',
    description: 'Intense emotion, fervent',
  },
  {
    type: 'nostalgic',
    label: 'Nostalgic',
    emoji: '🍂',
    description: 'Longing for the past, wistful',
  },
  {
    type: 'inspiring',
    label: 'Inspiring',
    emoji: '✨',
    description: 'Uplifting, motivational',
  },
];

interface EmotionSelectorProps {
  selectedEmotion?: EmotionType;
  onSelect: (emotion: EmotionType) => void;
  onRemove?: () => void;
}

export const EmotionSelector = forwardRef<BottomSheet, EmotionSelectorProps>(
  ({ selectedEmotion, onSelect, onRemove }, ref) => {
    const snapPoints = useMemo(() => ['65%'], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetDefaultBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleSelectEmotion = (emotion: EmotionType) => {
      onSelect(emotion);
      // Close bottom sheet after selection
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.close();
      }
    };

    const handleRemoveEmotion = () => {
      onRemove?.();
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.close();
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: Colors.paper }}
        handleIndicatorStyle={{ backgroundColor: Colors.pencil }}
      >
        <BottomSheetView style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="display" className="text-2xl text-ink">
              How does this make you feel?
            </Text>
            <Text variant="body" className="text-sm text-pencil mt-1">
              Tag your emotional response
            </Text>
          </View>

          {/* Emotion Grid */}
          <View style={styles.grid}>
            {EMOTIONS.map((emotion) => {
              const isSelected = selectedEmotion === emotion.type;
              return (
                <Pressable
                  key={emotion.type}
                  onPress={() => handleSelectEmotion(emotion.type)}
                  style={[
                    styles.emotionCard,
                    isSelected && styles.emotionCardSelected,
                  ]}
                >
                  <Text className="text-4xl mb-2">{emotion.emoji}</Text>
                  <Text variant="uiBold" className="text-sm text-ink mb-1">
                    {emotion.label}
                  </Text>
                  <Text variant="ui" className="text-xs text-pencil text-center">
                    {emotion.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Remove button (if emotion is already selected) */}
          {selectedEmotion && onRemove && (
            <View style={styles.footer}>
              <Pressable
                onPress={handleRemoveEmotion}
                style={styles.removeButton}
              >
                <Text variant="uiBold" className="text-sm text-wax">
                  Remove emotion tag
                </Text>
              </Pressable>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

EmotionSelector.displayName = 'EmotionSelector';

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  emotionCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${Colors.pencil}20`,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionCardSelected: {
    borderColor: Colors.ink,
    backgroundColor: `${Colors.ink}05`,
  },
  footer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${Colors.pencil}20`,
  },
  removeButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
});
