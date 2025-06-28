import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Choice } from '../types/story';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface ChoiceButtonProps {
  choice: Choice;
  onPress: (choiceId: string) => void;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChoiceButton({ choice, onPress, index }: ChoiceButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withSpring(1, { delay: index * 100 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    onPress(choice.id);
  };

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={styles.buttonText}>{choice.text}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  buttonText: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
});