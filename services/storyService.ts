import { GameState, Character, StoryScene, ConversationState, Message, Choice } from '../types/story';
import { GeminiService } from './geminiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'STORY_GAME_STATE';

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
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        this.gameState = JSON.parse(savedData);
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
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.gameState));
    } catch (error) {
      console.error('Failed to save game:', error);
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

      const openingMessage = await this.geminiService.generateStoryContent(
        `Generate an opening message from ${character.name} to start the story. This is their first contact with the player.`,
        context
      );

      const initialMessage: Message = {
        id: Date.now().toString(),
        senderId: characterId,
        text: openingMessage,
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
      const choices = await this.geminiService.generateChoices(context, characterId);
      this.gameState.conversations[characterId].availableChoices = choices.map((choice, index) => ({
        id: `choice_${Date.now()}_${index}`,
        text: choice.text,
        consequence: choice.consequence,
        relationshipEffect: choice.relationshipEffect || { [characterId]: 0 }
      }));
    }

    await this.saveGame();
    return this.gameState.conversations[characterId];
  }

  async makeChoice(characterId: string, choiceId: string): Promise<void> {
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
  }

  private async generateAIResponse(characterId: string, choiceConsequence: string): Promise<void> {
    if (!this.gameState) return;

    const conversation = this.gameState.conversations[characterId];
    const character = this.gameState.characters[characterId];

    // Show typing indicator
    const typingMessage: Message = {
      id: `typing_${Date.now()}`,
      senderId: characterId,
      text: '...',
      timestamp: new Date(),
      type: 'text',
      isTyping: true
    };

    conversation.messages.push(typingMessage);

    // Simulate typing delay
    setTimeout(async () => {
      // Remove typing indicator
      conversation.messages = conversation.messages.filter(m => !m.isTyping);

      const context = {
        character,
        playerName: this.gameState!.playerName,
        choiceConsequence,
        relationshipLevel: character.relationshipLevel,
        conversationHistory: conversation.messages.slice(-5),
        chapter: this.gameState!.currentChapter
      };

      const aiResponse = await this.geminiService.generateStoryContent(
        `Generate ${character.name}'s response to the player's choice. Consequence: ${choiceConsequence}`,
        context
      );

      const aiMessage: Message = {
        id: Date.now().toString(),
        senderId: characterId,
        text: aiResponse,
        timestamp: new Date(),
        type: 'text',
        isRead: false
      };

      conversation.messages.push(aiMessage);

      // Generate new choices for next interaction
      const newChoices = await this.geminiService.generateChoices(context, characterId);
      conversation.availableChoices = newChoices.map((choice, index) => ({
        id: `choice_${Date.now()}_${index}`,
        text: choice.text,
        consequence: choice.consequence,
        relationshipEffect: choice.relationshipEffect || { [characterId]: 0 }
      }));

      conversation.isWaitingForResponse = true;
      await this.saveGame();
    }, 2000);
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
}