import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Phone, Video } from 'lucide-react-native';
import { ChatBubble } from '../../components/ChatBubble';
import { ChoiceButton } from '../../components/ChoiceButton';
import { EmotionOverlay } from '../../components/EmotionOverlay';
import { StoryService } from '../../services/storyService';
import { GameState, ConversationState, Message, Character } from '../../types/story';

export default function ChatScreen() {
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [conversation, setConversation] = useState<ConversationState | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [showEmotion, setShowEmotion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChoiceLoading, setIsChoiceLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
  }, [characterId]);

  useEffect(() => {
    // Mark messages as read when conversation loads
    if (conversation && character) {
      markMessagesAsRead();
    }
  }, [conversation, character]);

  const loadConversation = async () => {
    if (!characterId) return;

    setIsLoading(true);
    try {
      const storyService = StoryService.getInstance();
      
      // First ensure we have a game state
      let state = storyService.getGameState();
      if (!state) {
        // Try to load from storage
        state = await storyService.loadGame();
        if (!state) {
          // Initialize new game if nothing exists
          state = await storyService.initializeGame('Player');
        }
      }
      
      setGameState(state);
      setCharacter(state.characters[characterId]);
      
      if (state.conversations[characterId]) {
        setConversation(state.conversations[characterId]);
      } else {
        const newConversation = await storyService.startConversation(characterId);
        setConversation(newConversation);
        // Update game state after starting conversation
        const updatedState = storyService.getGameState();
        if (updatedState) {
          setGameState(updatedState);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversation || !gameState || !characterId) return;

    const hasUnreadMessages = conversation.messages.some(
      msg => msg.senderId !== 'player' && !msg.isRead
    );

    if (hasUnreadMessages) {
      // Create new messages array with updated read status
      const updatedMessages = conversation.messages.map(msg => {
        if (msg.senderId !== 'player' && !msg.isRead) {
          return { ...msg, isRead: true };
        }
        return msg;
      });

      // Create new conversation object with updated messages
      const updatedConversation = {
        ...conversation,
        messages: updatedMessages
      };

      // Update local state
      setConversation(updatedConversation);

      // Update global state
      const storyService = StoryService.getInstance();
      await storyService.updateConversation(characterId, updatedConversation);
    }
  };

  const handleChoicePress = async (choiceId: string) => {
    if (!characterId || isChoiceLoading) return;

    setIsChoiceLoading(true);
    try {
      const storyService = StoryService.getInstance();
      
      // Show temporary emotion overlay
      setShowEmotion('thinking...');
      
      // Make choice and get updated conversation
      const updatedConversation = await storyService.makeChoice(characterId, choiceId);
      
      // Update local state immediately
      setConversation(updatedConversation);
      
      // Update game state
      const newGameState = storyService.getGameState();
      if (newGameState) {
        setGameState(newGameState);
        setCharacter(newGameState.characters[characterId]);
      }
      
      setTimeout(() => setShowEmotion(null), 1500);
      
    } catch (error) {
      console.error('Failed to make choice:', error);
      setShowEmotion(null);
    } finally {
      setIsChoiceLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    if (conversation) {
      scrollToBottom();
    }
  }, [conversation?.messages.length]);

  if (!character || !conversation || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isLoading ? 'Loading conversation...' : 'Connecting...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const messages = conversation.messages.filter(msg => !msg.isTyping);
  const hasTypingMessage = conversation.messages.some(msg => msg.isTyping);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <ArrowLeft size={24} color="#4A90E2" />
        </Pressable>
        
        <View style={styles.headerInfo}>
          <Image source={{ uri: character.avatar }} style={styles.headerAvatar} />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{character.name}</Text>
            <Text style={styles.headerStatus}>
              {character.isOnline ? 'Online' : 'Last seen recently'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.actionButton}>
            <Phone size={20} color="#4A90E2" />
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Video size={20} color="#4A90E2" />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isPlayer={item.senderId === 'player'}
            characterAvatar={character.avatar}
          />
        )}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      />

      {/* Typing Indicator */}
      {hasTypingMessage && (
        <View style={styles.typingContainer}>
          <ChatBubble
            message={conversation.messages.find(m => m.isTyping)!}
            isPlayer={false}
            characterAvatar={character.avatar}
          />
        </View>
      )}

      {/* Choice Buttons */}
      {conversation.isWaitingForResponse && conversation.availableChoices.length > 0 && !isChoiceLoading && (
        <View style={styles.choicesContainer}>
          {conversation.availableChoices.map((choice, index) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              onPress={handleChoicePress}
              index={index}
            />
          ))}
        </View>
      )}

      {/* Loading State for Choices */}
      {isChoiceLoading && (
        <View style={styles.choicesContainer}>
          <Text style={styles.loadingText}>Generating response...</Text>
        </View>
      )}

      {/* Emotion Overlay */}
      {showEmotion && (
        <EmotionOverlay
          text={showEmotion}
          character={character.name}
          onComplete={() => setShowEmotion(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Inter-SemiBold',
  },
  headerStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContent: {
    paddingVertical: 16,
  },
  typingContainer: {
    backgroundColor: '#f8f9fa',
  },
  choicesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
});