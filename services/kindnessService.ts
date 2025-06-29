import AsyncStorage from '@react-native-async-storage/async-storage';

const KINDNESS_STORAGE_KEY = 'KINDNESS_DATA';

export interface KindnessEntry {
  id: string;
  type: 'shared' | 'received';
  description: string;
  value: number; // 1-10 scale
  timestamp: Date;
  category: 'compliment' | 'help' | 'gift' | 'time' | 'listening' | 'other';
}

export interface KindnessStats {
  totalShared: number;
  totalReceived: number;
  weeklyShared: number;
  weeklyReceived: number;
  streak: number;
  lastActivity: Date | null;
}

export class KindnessService {
  private static instance: KindnessService;
  private entries: KindnessEntry[] = [];

  static getInstance(): KindnessService {
    if (!KindnessService.instance) {
      KindnessService.instance = new KindnessService();
    }
    return KindnessService.instance;
  }

  async loadEntries(): Promise<KindnessEntry[]> {
    try {
      const savedData = await AsyncStorage.getItem(KINDNESS_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.entries = parsedData.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
      return this.entries;
    } catch (error) {
      console.error('Failed to load kindness entries:', error);
      return [];
    }
  }

  async saveEntries(): Promise<void> {
    try {
      const dataToSave = this.entries.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      }));
      await AsyncStorage.setItem(KINDNESS_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save kindness entries:', error);
    }
  }

  async addEntry(entry: Omit<KindnessEntry, 'id' | 'timestamp'>): Promise<KindnessEntry> {
    const newEntry: KindnessEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    this.entries.push(newEntry);
    await this.saveEntries();
    return newEntry;
  }

  async getStats(): Promise<KindnessStats> {
    await this.loadEntries();
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const sharedEntries = this.entries.filter(e => e.type === 'shared');
    const receivedEntries = this.entries.filter(e => e.type === 'received');
    
    const weeklyShared = sharedEntries.filter(e => e.timestamp >= weekAgo).length;
    const weeklyReceived = receivedEntries.filter(e => e.timestamp >= weekAgo).length;
    
    // Calculate streak (consecutive days with activity)
    let streak = 0;
    const sortedEntries = [...this.entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (sortedEntries.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = new Date(today);
      
      for (let i = 0; i < 30; i++) { // Check last 30 days max
        const dayEntries = sortedEntries.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === currentDate.getTime();
        });
        
        if (dayEntries.length > 0) {
          streak++;
        } else {
          break;
        }
        
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    return {
      totalShared: sharedEntries.length,
      totalReceived: receivedEntries.length,
      weeklyShared,
      weeklyReceived,
      streak,
      lastActivity: sortedEntries.length > 0 ? sortedEntries[0].timestamp : null
    };
  }

  async getRecentEntries(limit: number = 10): Promise<KindnessEntry[]> {
    await this.loadEntries();
    return [...this.entries]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getTotalKindnessValue(): Promise<number> {
    await this.loadEntries();
    return this.entries.reduce((total, entry) => total + entry.value, 0);
  }
}