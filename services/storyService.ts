import { GameState, Character, StoryScene, ConversationState, Message, Choice } from '../types/story';
import { AIService } from './aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'STORY_GAME_STATE';

export class StoryService {
  private static instance: StoryService;
  private aiService: AIService;
  private gameState: GameState | null = null;
  private conversationUpdateCallbacks: Map<string, (() => void)[]> = new Map();

  static getInstance(): StoryService {
    if (!StoryService.instance) {
      StoryService.instance = new StoryService();
    }
    return StoryService.instance;
  }

  constructor() {
    this.aiService = AIService.getInstance();
  }

  async initializeGame(playerName: string): Promise<GameState> {
    const initialCharacters: { [id: string]: Character } = {
      'alex': {
        id: 'alex',
        name: 'Alex Chen',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        isUnlocked: true,
        relationshipLevel: 0,
        isOnline: true,
        description: 'Your best friend since college. Tech-savvy and always curious about the strange happenings in town.',
        role: 'friend'
      },
      'maya': {
        id: 'maya',
        name: 'Dr. Maya Rodriguez',
        avatar: 'https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg',
        isUnlocked: false,
        relationshipLevel: 0,
        isOnline: false,
        description: 'A quantum physicist studying temporal anomalies. Brilliant but secretive.',
        role: 'romantic_interest'
      },
      'unknown': {
        id: 'unknown',
        name: '???',
        avatar: 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg',
        isUnlocked: false,
        relationshipLevel: 0,
        isOnline: false,
        description: 'Strange messages from an unknown sender...',
        role: 'mystery'
      }
    };

    this.gameState = {
      playerId: 'player',
      playerName,
      currentChapter: 1,
      completedScenes: [],
      characters: initialCharacters,
      conversations: {},
      globalFlags: {},
      relationshipScores: {},
      unlockedEndings: [],
      gameStarted: new Date(),
      lastPlayed: new Date()
    };

    // Initialize first conversation with Alex
    await this.startConversation('alex');
    await this.saveGame();
    return this.gameState;
  }

  async loadGame(): Promise<GameState | null> {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Convert date strings back to Date objects
        this.gameState = {
          ...parsedData,
          gameStarted: new Date(parsedData.gameStarted),
          lastPlayed: new Date(parsedData.lastPlayed),
          conversations: Object.fromEntries(
            Object.entries(parsedData.conversations || {}).map(([id, conversation]: [string, any]) => [
              id,
              {
                ...conversation,
                messages: (conversation.messages || []).map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }))
              }
            ])
          )
        };
        
        return this.gameState;
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
    return null;
  }

  async saveGame(): Promise<void> {
    if (!this.gameState) return;
    
    try {
      this.gameState.lastPlayed = new Date();
      // Create a serializable copy of the game state
      const gameStateToSave = {
        ...this.gameState,
        gameStarted: this.gameState.gameStarted.toISOString(),
        lastPlayed: this.gameState.lastPlayed.toISOString(),
        conversations: Object.fromEntries(
          Object.entries(this.gameState.conversations).map(([id, conversation]) => [
            id,
            {
              ...conversation,
              messages: conversation.messages.map(msg => ({
                ...msg,
                timestamp: msg.timestamp.toISOString()
              }))
            }
          ])
        )
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameStateToSave));
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  async startConversation(characterId: string): Promise<ConversationState> {
    if (!this.gameState) throw new Error('Game not initialized');

    console.log('[StoryService] Starting conversation for:', characterId);
    const character = this.gameState.characters[characterId];
    if (!character || !character.isUnlocked) {
      throw new Error('Character not available');
    }

    if (!this.gameState.conversations[characterId]) {
      console.log('[StoryService] Creating new conversation...');
      
      const context = {
        character: character,
        playerName: this.gameState.playerName,
        chapter: this.gameState.currentChapter,
        relationshipLevel: character.relationshipLevel
      };
      
      // Create conversation immediately with fallback content
      const fallbackMessage = character.id === 'alex' 
        ? `Hey ${this.gameState.playerName}! Something strange is happening in town...`
        : `Hello... I need to tell you something important.`;
      
      const initialMessage: Message = {
        id: Date.now().toString(),
        senderId: characterId,
        text: fallbackMessage,
        timestamp: new Date(),
        type: 'text',
        isRead: false
      };

      this.gameState.conversations[characterId] = {
        characterId,
        messages: [initialMessage],
        currentSceneId: 'opening',
        availableChoices: this.getFallbackChoices(characterId).map((choice: any, index: number) => ({
          id: `choice_${Date.now()}_${index}`,
          text: choice.text,
          consequence: choice.consequence,
          relationshipEffect: choice.relationshipEffect || { [characterId]: 0 }
        })),
        isWaitingForResponse: true
      };

      console.log('[StoryService] Conversation setup complete with fallback content');
      
      // Now try to get AI content in the background (non-blocking)
      this.enhanceConversationWithAI(characterId, context);
    }

    await this.saveGame();
    return this.gameState.conversations[characterId];
  }

  async makeChoice(characterId: string, choiceId: string): Promise<ConversationState> {
    if (!this.gameState) throw new Error('Game not initialized');

    const conversation = this.gameState.conversations[characterId];
    if (!conversation) throw new Error('Conversation not found');

    const choice = conversation.availableChoices.find(c => c.id === choiceId);
    if (!choice) throw new Error('Choice not found');

    // Add player's choice as a message
    const playerMessage: Message = {
      id: Date.now().toString(),
      senderId: 'player',
      text: choice.text,
      timestamp: new Date(),
      type: 'text',
      isRead: true
    };

    conversation.messages.push(playerMessage);

    // Clear choices and set waiting state
    conversation.availableChoices = [];
    conversation.isWaitingForResponse = false;

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing_${Date.now()}`,
      senderId: characterId,
      text: '...',
      timestamp: new Date(),
      type: 'text',
      isRead: false,
      isTyping: true
    };
    conversation.messages.push(typingMessage);

    // Apply relationship effects
    if (choice.relationshipEffect) {
      Object.entries(choice.relationshipEffect).forEach(([charId, effect]) => {
        if (this.gameState!.characters[charId]) {
          this.gameState!.characters[charId].relationshipLevel += effect;
          this.gameState!.relationshipScores[charId] = 
            (this.gameState!.relationshipScores[charId] || 0) + effect;
        }
      });
    }

    // Unlock new characters if specified
    if (choice.unlockCharacters) {
      choice.unlockCharacters.forEach(charId => {
        if (this.gameState!.characters[charId]) {
          this.gameState!.characters[charId].isUnlocked = true;
          this.gameState!.characters[charId].isOnline = true;
        }
      });
    }

    // Save current state
    await this.saveGame();
    
    // Notify UI about the immediate update (player message + typing indicator)
    this.notifyConversationUpdate(characterId);

    // Generate AI response asynchronously with a small delay to show typing indicator
    setTimeout(async () => {
      await this.generateAIResponse(characterId, choice.consequence);
    }, 1500); // Show typing indicator for 1.5 seconds
    
    return conversation;
  }

  private async generateAIResponse(characterId: string, choiceConsequence: string): Promise<void> {
    if (!this.gameState) return;

    const conversation = this.gameState.conversations[characterId];
    const character = this.gameState.characters[characterId];

    const context = {
      character,
      playerName: this.gameState.playerName,
      choiceConsequence,
      relationshipLevel: character.relationshipLevel,
      conversationHistory: conversation.messages.slice(-5).map(m => ({ 
        sender: m.senderId === 'player' ? 'player' : character.name, 
        message: m.text 
      })),
      chapter: this.gameState.currentChapter,
      totalMessages: conversation.messages.length,
      gameFlags: this.gameState.globalFlags
    };

    try {
      // Generate AI response
      const aiResponse = await this.aiService.generateStoryContent(
        `Continue the interactive horror/romance story. ${character.name} is responding to the player's choice. 
        Consequence: ${choiceConsequence}. 
        Make the response engaging and advance the story. Reference previous conversation context.
        Keep it under 120 characters for mobile chat.`,
        context
      );

      // Remove typing indicator
      conversation.messages = conversation.messages.filter(m => !m.isTyping);

      // Validate AI response and provide fallback
      let responseText = aiResponse;
      if (!aiResponse || aiResponse.length < 5 || aiResponse.includes('Something went wrong')) {
        console.error('Invalid AI response received:', aiResponse);
        // Use contextual fallback based on character
        if (character.id === 'alex') {
          responseText = "That's... not what I expected. Let me think about this.";
        } else if (character.id === 'maya') {
          responseText = "Interesting choice. The data suggests this could work.";
        } else {
          responseText = "Your choice has consequences... we'll see what happens.";
        }
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        senderId: characterId,
        text: responseText,
        timestamp: new Date(),
        type: 'text',
        isRead: false
      };

      conversation.messages.push(aiMessage);

      // Generate new intelligent choices for next interaction
      const newChoices = await this.aiService.generateChoices({
        ...context,
        lastAIResponse: aiResponse,
        storyProgression: this.calculateStoryProgression(characterId),
        relationshipTier: this.getRelationshipTier(character.relationshipLevel)
      }, characterId);

      conversation.availableChoices = newChoices.map((choice, index) => ({
        id: `choice_${Date.now()}_${index}`,
        text: choice.text,
        consequence: choice.consequence,
        relationshipEffect: choice.relationshipEffect || { [characterId]: 0 }
      }));

      // Set waiting for response state
      conversation.isWaitingForResponse = true;

      // Save game state
      await this.saveGame();
      
      // Notify UI about the AI response completion
      this.notifyConversationUpdate(characterId);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Remove typing indicator on error
      conversation.messages = conversation.messages.filter(m => !m.isTyping);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        senderId: characterId,
        text: "Something went wrong... let me try again.",
        timestamp: new Date(),
        type: 'text',
        isRead: false
      };
      
      conversation.messages.push(errorMessage);
      
      // Add basic retry choices
      conversation.availableChoices = [
        {
          id: `retry_${Date.now()}`,
          text: "Try again",
          consequence: "retry the conversation",
          relationshipEffect: { [characterId]: 0 }
        }
      ];
      
      conversation.isWaitingForResponse = true;
      await this.saveGame();
      
      // Notify UI about error state
      this.notifyConversationUpdate(characterId);
    }
  }

  private calculateStoryProgression(characterId: string): string {
    if (!this.gameState) return 'beginning';
    
    const conversation = this.gameState.conversations[characterId];
    const messageCount = conversation?.messages.length || 0;
    
    if (messageCount < 6) return 'beginning';
    if (messageCount < 15) return 'developing';
    if (messageCount < 25) return 'climax';
    return 'resolution';
  }

  private getRelationshipTier(level: number): string {
    if (level < -10) return 'hostile';
    if (level < 0) return 'unfriendly';
    if (level < 5) return 'neutral';
    if (level < 15) return 'friendly';
    if (level < 25) return 'close';
    return 'intimate';
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  async updateConversation(characterId: string, updatedConversation: ConversationState): Promise<void> {
    if (!this.gameState) return;
    
    this.gameState.conversations[characterId] = updatedConversation;
    await this.saveGame();
  }

  async unlockCharacter(characterId: string): Promise<void> {
    if (!this.gameState) return;
    
    if (this.gameState.characters[characterId]) {
      this.gameState.characters[characterId].isUnlocked = true;
      this.gameState.characters[characterId].isOnline = true;
      await this.saveGame();
    }
  }

  async resetGame(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.gameState = null;
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  }

  // Add callback system for real-time updates
  onConversationUpdate(characterId: string, callback: () => void): () => void {
    if (!this.conversationUpdateCallbacks.has(characterId)) {
      this.conversationUpdateCallbacks.set(characterId, []);
    }
    this.conversationUpdateCallbacks.get(characterId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.conversationUpdateCallbacks.get(characterId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifyConversationUpdate(characterId: string): void {
    const callbacks = this.conversationUpdateCallbacks.get(characterId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in conversation update callback:', error);
        }
      });
    }
  }

  private getFallbackChoices(characterId: string): any[] {
    return [
      { text: "Tell me more about this", consequence: "shows interest in character's story", relationshipEffect: { [characterId]: 1 } },
      { text: "That sounds suspicious...", consequence: "character becomes more defensive", relationshipEffect: { [characterId]: -1 } },
      { text: "I'm here to help", consequence: "builds trust with character", relationshipEffect: { [characterId]: 2 } },
      { text: "What's going on?", consequence: "asks for more information", relationshipEffect: { [characterId]: 0 } }
    ];
  }

  private async enhanceConversationWithAI(characterId: string, context: any): Promise<void> {
    try {
      console.log('[StoryService] Enhancing conversation with AI in background...');
      
      // Try to get better opening message
      const aiMessage = await this.aiService.generateStoryContent(
        `Generate an opening message from ${context.character.name} to start the story. This is their first contact with the player.`,
        context
      );
      
      // Try to get better choices
      const aiChoices = await this.aiService.generateChoices(context, characterId);
      
      if (this.gameState && this.gameState.conversations[characterId]) {
        let updated = false;
        
        // Update message if AI provided a good one
        if (aiMessage && typeof aiMessage === 'string' && aiMessage.length > 10 && !aiMessage.includes('Connection lost')) {
          this.gameState.conversations[characterId].messages[0].text = aiMessage;
          updated = true;
          console.log('[StoryService] Updated opening message with AI content');
        }
        
        // Update choices if AI provided good ones
        if (aiChoices && Array.isArray(aiChoices) && aiChoices.length > 0) {
          this.gameState.conversations[characterId].availableChoices = aiChoices.map((choice: any, index: number) => ({
            id: `choice_ai_${Date.now()}_${index}`,
            text: choice.text,
            consequence: choice.consequence,
            relationshipEffect: choice.relationshipEffect || { [characterId]: 0 }
          }));
          updated = true;
          console.log('[StoryService] Updated choices with AI content');
        }
        
        if (updated) {
          await this.saveGame();
          this.notifyConversationUpdate(characterId);
        }
      }
    } catch (error) {
      console.error('[StoryService] Failed to enhance conversation with AI:', error);
      // Fail silently - we already have fallback content
    }
  }
}