import { GameState, Character, StoryScene, ConversationState, Message, Choice } from '../types/story';
import { GeminiService } from './geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'STORY_GAME_STATE';

// Web-compatible storage fallback
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch {
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Silently fail if storage is not available
    }
  },
  
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Silently fail if storage is not available
    }
  },
  
  async getAllKeys(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return Object.keys(window.localStorage);
      }
      return [];
    } catch {
      return [];
    }
  },
  
  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        keys.forEach(key => window.localStorage.removeItem(key));
      }
    } catch {
      // Silently fail if storage is not available
    }
  }
};

// Use appropriate storage based on platform
const storage = Platform.OS === 'web' ? webStorage : AsyncStorage;

export class StoryService {
  private static instance: StoryService;
  private geminiService: GeminiService;
  private gameState: GameState | null = null;

  static getInstance(): StoryService {
    if (!StoryService.instance) {
      StoryService.instance = new StoryService();
    }
    return StoryService.instance;
  }

  constructor() {
    this.geminiService = GeminiService.getInstance();
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
      const savedData = await storage.getItem(STORAGE_KEY);
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
      // Don't throw error, just return null to allow new game creation
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
      
      await storage.setItem(STORAGE_KEY, JSON.stringify(gameStateToSave));
    } catch (error) {
      console.error('Failed to save game:', error);
      // Don't throw error, just log it
    }
  }

  async startConversation(characterId: string): Promise<ConversationState> {
    if (!this.gameState) throw new Error('Game not initialized');

    const character = this.gameState.characters[characterId];
    if (!character || !character.isUnlocked) {
      throw new Error('Character not available');
    }

    if (!this.gameState.conversations[characterId]) {
      // Generate opening message using Gemini
      const context = {
        character: character,
        playerName: this.gameState.playerName,
        chapter: this.gameState.currentChapter,
        relationshipLevel: character.relationshipLevel
      };

      let openingMessage: string;
      
      try {
        openingMessage = await this.geminiService.generateStoryContent(
          `Generate an opening message from ${character.name} to start the story. This is their first contact with the player.`,
          context
        );
      } catch (error) {
        console.error('Failed to generate opening message:', error);
        // Use fallback message
        openingMessage = character.id === 'alex' 
          ? `Hey ${this.gameState.playerName}! Something strange is happening in town...`
          : `Hello... I need to tell you something important.`;
      }

      // Validate the opening message and create fallback if needed
      let messageText = openingMessage;
      if (!openingMessage || openingMessage.length < 5 || openingMessage.includes('Something went wrong')) {
        console.error('Invalid opening message received:', openingMessage);
        // Use a fallback message
        messageText = character.id === 'alex' 
          ? `Hey ${this.gameState.playerName}! Something strange is happening in town...`
          : `Hello... I need to tell you something important.`;
      }
      
      const initialMessage: Message = {
        id: Date.now().toString(),
        senderId: characterId,
        text: messageText,
        timestamp: new Date(),
        type: 'text',
        isRead: false
      };

      this.gameState.conversations[characterId] = {
        characterId,
        messages: [initialMessage],
        currentSceneId: 'opening',
        availableChoices: [],
        isWaitingForResponse: true
      };

      // Generate initial choices
      try {
        const choices = await this.geminiService.generateChoices(context, characterId);
        this.gameState.conversations[characterId].availableChoices = choices.map((choice, index) => ({
          id: `choice_${Date.now()}_${index}`,
          text: choice.text,
          consequence: choice.consequence,
          relationshipEffect: choice.relationshipEffect || { [characterId]: 0 }
        }));
      } catch (error) {
        console.error('Failed to generate initial choices:', error);
        // Use fallback choices
        this.gameState.conversations[characterId].availableChoices = [
          {
            id: `choice_${Date.now()}_0`,
            text: "Tell me more",
            consequence: "shows interest",
            relationshipEffect: { [characterId]: 1 }
          },
          {
            id: `choice_${Date.now()}_1`,
            text: "I'm listening",
            consequence: "neutral response",
            relationshipEffect: { [characterId]: 0 }
          }
        ];
      }
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

    // Generate AI response
    conversation.isWaitingForResponse = false;
    await this.generateAIResponse(characterId, choice.consequence);
    await this.saveGame();
    
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

    let aiResponse: string;
    
    try {
      // Generate AI response
      aiResponse = await this.geminiService.generateStoryContent(
        `Continue the interactive horror/romance story. ${character.name} is responding to the player's choice. 
        Consequence: ${choiceConsequence}. 
        Make the response engaging and advance the story. Reference previous conversation context.
        Keep it under 120 characters for mobile chat.`,
        context
      );
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      // Use contextual fallback based on character
      if (character.id === 'alex') {
        aiResponse = "That's... not what I expected. Let me think about this.";
      } else if (character.id === 'maya') {
        aiResponse = "Interesting choice. The data suggests this could work.";
      } else {
        aiResponse = "Your choice has consequences... we'll see what happens.";
      }
    }

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
    try {
      const newChoices = await this.geminiService.generateChoices({
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
    } catch (error) {
      console.error('Failed to generate new choices:', error);
      // Use fallback choices
      conversation.availableChoices = [
        {
          id: `choice_${Date.now()}_0`,
          text: "Continue...",
          consequence: "neutral response",
          relationshipEffect: { [characterId]: 0 }
        },
        {
          id: `choice_${Date.now()}_1`,
          text: "Tell me more",
          consequence: "shows interest",
          relationshipEffect: { [characterId]: 1 }
        }
      ];
    }

    conversation.isWaitingForResponse = true;
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
      await storage.removeItem(STORAGE_KEY);
      this.gameState = null;
      
      // Force a complete reset by clearing any cached data
      const keys = await storage.getAllKeys();
      const gameKeys = keys.filter(key => key.startsWith('STORY_') || key === STORAGE_KEY);
      if (gameKeys.length > 0) {
        await storage.multiRemove(gameKeys);
      }
    } catch (error) {
      console.error('Failed to reset game:', error);
      // Don't throw error, just log it
    }
  }

  async updatePlayerName(newName: string): Promise<void> {
    if (!this.gameState) throw new Error('Game not initialized');
    
    this.gameState.playerName = newName;
    await this.saveGame();
  }
}