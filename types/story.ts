export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  isRead?: boolean;
  isTyping?: boolean;
}

export interface Choice {
  id: string;
  text: string;
  consequence: string;
  relationshipEffect?: { [characterId: string]: number };
  unlockCharacters?: string[];
  triggerEvent?: string;
  isPaywallLocked?: boolean;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  isUnlocked: boolean;
  relationshipLevel: number;
  lastSeen?: Date;
  isOnline: boolean;
  description: string;
  role: 'friend' | 'romantic_interest' | 'antagonist' | 'mystery';
}

export interface ConversationState {
  characterId: string;
  messages: Message[];
  currentSceneId: string;
  availableChoices: Choice[];
  isWaitingForResponse: boolean;
}

export interface GameState {
  playerId: string;
  playerName: string;
  currentChapter: number;
  completedScenes: string[];
  characters: { [id: string]: Character };
  conversations: { [characterId: string]: ConversationState };
  globalFlags: { [key: string]: boolean };
  relationshipScores: { [characterId: string]: number };
  unlockedEndings: string[];
  gameStarted: Date;
  lastPlayed: Date;
}

export interface StoryScene {
  id: string;
  characterId: string;
  trigger: string;
  messages: Omit<Message, 'id' | 'timestamp'>[];
  choices: Choice[];
  unlockConditions?: string[];
  emotionOverlay?: {
    text: string;
    duration: number;
    character: string;
  };
}