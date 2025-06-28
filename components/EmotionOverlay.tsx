import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface EmotionOverlayProps {
  text: string;
  character: string;
  duration?: number;
  onComplete?: () => void;
}

export function EmotionOverlay({ 
  text, 
  character, 
  duration = 3000, 
  onComplete 
}: EmotionOverlayProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: duration - 1000 }),
      withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
    );

    scale.value = withSequence(
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) }),
      withTiming(1, { duration: duration - 1000 }),
      withTiming(0.8, { duration: 500 })
    );

    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.overlay, animatedStyle]}>
        <Text style={styles.characterName}>{character}</Text>
        <Text style={styles.emotionText}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    maxWidth: '80%',
    alignItems: 'center',
  },
  characterName: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emotionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
});