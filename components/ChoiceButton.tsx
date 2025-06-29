import React from 'react';
import { Pressable, Text, StyleSheet, View, Alert } from 'react-native';
import { Choice } from '../types/story';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ThemeColors } from '../hooks/useTheme';
import { Lock } from 'lucide-react-native';

interface ChoiceButtonProps {
  choice: Choice;
  onPress: (choiceId: string) => void;
  index: number;
  colors: ThemeColors;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChoiceButton({ choice, onPress, index, colors }: ChoiceButtonProps) {
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
    if (!choice.isPaywallLocked) {
      scale.value = withSpring(0.95);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (choice.isPaywallLocked) {
      Alert.alert(
        'Premium Feature',
        'This choice requires premium access. Unlock deeper relationships and exclusive story content with premium!',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Learn More', onPress: () => {
            Alert.alert(
              'Premium Benefits',
              '• Unlock deeper relationship levels\n• Access exclusive romantic content\n• Multiple story endings\n• Priority AI responses\n• No ads',
              [{ text: 'OK' }]
            );
          }}
        ]
      );
    } else {
      onPress(choice.id);
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.button, 
        animatedStyle, 
        { 
          backgroundColor: choice.isPaywallLocked ? colors.background : colors.card, 
          borderColor: choice.isPaywallLocked ? colors.accent : colors.border,
          opacity: choice.isPaywallLocked ? 0.8 : 1
        }
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.buttonContent}>
        {choice.isPaywallLocked && (
          <Lock size={16} color={colors.accent} style={styles.lockIcon} />
        )}
        <Text style={[
          styles.buttonText, 
          { color: choice.isPaywallLocked ? colors.accent : colors.text }
        ]}>
          {choice.text}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});