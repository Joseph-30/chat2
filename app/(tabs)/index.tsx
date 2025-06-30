import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ContactListItem } from '../../components/ContactListItem';
import { PlayerNameModal } from '../../components/PlayerNameModal';
import { StoryService } from '../../services/storyService';
import { GameState, Character, ConversationState } from '../../types/story';
import { useTheme } from '../../hooks/useTheme';

export default function ContactsScreen() {
  const { colors } = useTheme();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    console.log('[ContactsScreen] Starting initializeGame...');
    const storyService = StoryService.getInstance();
    
    try {
      console.log('[ContactsScreen] Creating load promise...');
      // Try to load existing game with timeout
      const loadPromise = storyService.loadGame();
      const timeoutPromise = new Promise<null>((resolve) => {
        console.log('[ContactsScreen] Setting up 5 second timeout...');
        setTimeout(() => resolve(null), 5000); // 5 second timeout
      });
      
      console.log('[ContactsScreen] Racing load promise against timeout...');
      let state = await Promise.race([loadPromise, timeoutPromise]);
      console.log('[ContactsScreen] Promise race completed. State:', state ? 'Game state loaded' : 'No state or timeout');
      
      if (!state) {
        console.log('[ContactsScreen] No existing game found or load timed out, showing name modal');
        setShowNameModal(true);
        setIsLoading(false);
        return;
      }
      
      console.log('[ContactsScreen] Setting game state:', {
        playerName: state.playerName,
        currentChapter: state.currentChapter,
        charactersCount: Object.keys(state.characters).length
      });
      setGameState(state);
    } catch (error) {
      console.error('[ContactsScreen] Failed to initialize game - Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      console.log('[ContactsScreen] Load failed, starting new game');
      setShowNameModal(true);
    } finally {
      console.log('[ContactsScreen] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handlePlayerNameSubmit = async (playerName: string) => {
    setShowNameModal(false);
    setIsLoading(true);
    
    try {
      const storyService = StoryService.getInstance();
      const state = await storyService.initializeGame(playerName);
      setGameState(state);
    } catch (error) {
      console.error('Failed to initialize game with player name:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {showNameModal ? 'Preparing your adventure...' : 'Loading your story...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameState) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <PlayerNameModal
          visible={showNameModal}
          onSubmit={handlePlayerNameSubmit}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {showNameModal ? 'Starting new adventure...' : 'Welcome! Let\'s begin your story.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const characters = Object.values(gameState.characters);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PlayerNameModal
        visible={showNameModal}
        onSubmit={handlePlayerNameSubmit}
      />
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Contacts</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Chapter {gameState.currentChapter}</Text>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 14,
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
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});