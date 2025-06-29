import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Modal } from 'react-native';
import { User, Play } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface PlayerNameModalProps {
  visible: boolean;
  onSubmit: (name: string) => void;
}

export function PlayerNameModal({ visible, onSubmit }: PlayerNameModalProps) {
  const { colors } = useTheme();
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmedName = playerName.trim();
    
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    
    if (trimmedName.length > 20) {
      setError('Name must be less than 20 characters');
      return;
    }
    
    setError('');
    onSubmit(trimmedName);
  };

  const handleNameChange = (text: string) => {
    setPlayerName(text);
    if (error) setError('');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <User size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to the Story</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your name to begin your interactive adventure
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.text }]}>Your Name</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  borderColor: error ? colors.error : colors.border,
                  color: colors.text
                }
              ]}
              value={playerName}
              onChangeText={handleNameChange}
              placeholder="Enter your name..."
              placeholderTextColor={colors.textSecondary}
              maxLength={20}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {error ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            ) : null}
          </View>

          <Pressable
            style={[
              styles.button,
              { 
                backgroundColor: playerName.trim() ? colors.primary : colors.border,
                opacity: playerName.trim() ? 1 : 0.6
              }
            ]}
            onPress={handleSubmit}
            disabled={!playerName.trim()}
          >
            <Play size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start Your Story</Text>
          </Pressable>

          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
            Your choices will shape the story and determine your relationships with other characters.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
});