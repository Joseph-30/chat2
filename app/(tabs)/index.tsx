import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ContactListItem } from '../../components/ContactListItem';
import { StoryService } from '../../services/storyService';
import { GameState, Character, ConversationState } from '../../types/story';

export default function ContactsScreen() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    const storyService = StoryService.getInstance();
    
    try {
      // Try to load existing game
      let state = await storyService.loadGame();
      
      if (!state) {
        // Create new game
        state = await storyService.initializeGame('Player');
      }
      
      setGameState(state);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      Alert.alert('Error', 'Failed to load game. Please restart the app.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactPress = async (characterId: string) => {
    if (!gameState) return;

    const character = gameState.characters[characterId];
    if (!character.isUnlocked) {
      Alert.alert('Locked', 'This contact is not available yet. Continue the story to unlock them.');
      return;
    }

    try {
      const storyService = StoryService.getInstance();
      await storyService.startConversation(characterId);
      router.push(`/chat/${characterId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const getLastMessage = (conversation: ConversationState | undefined): string | undefined => {
    if (!conversation || conversation.messages.length === 0) return undefined;
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.text;
  };

  const getLastMessageTime = (conversation: ConversationState | undefined): Date | undefined => {
    if (!conversation || conversation.messages.length === 0) return undefined;
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.timestamp;
  };

  const hasUnreadMessages = (characterId: string): boolean => {
    const conversation = gameState?.conversations[characterId];
    if (!conversation) return false;
    
    return conversation.messages.some(msg => 
      msg.senderId !== 'player' && !msg.isRead
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your story...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load game</Text>
        </View>
      </SafeAreaView>
    );
  }

  const characters = Object.values(gameState.characters);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <Text style={styles.subtitle}>Chapter {gameState.currentChapter}</Text>
      </View>
      
      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactListItem
            character={item}
            onPress={handleContactPress}
            hasUnreadMessages={hasUnreadMessages(item.id)}
            lastMessage={getLastMessage(gameState.conversations[item.id])}
            lastMessageTime={getLastMessageTime(gameState.conversations[item.id])}
          />
        )}
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  list: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    fontFamily: 'Inter-Regular',
  },
});