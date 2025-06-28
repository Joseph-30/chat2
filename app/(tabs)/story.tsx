import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryService } from '../../services/storyService';
import { GameState } from '../../types/story';
import { Heart, Users, Clock, Trophy } from 'lucide-react-native';

export default function StoryScreen() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    loadGameState();
  }, []);

  const loadGameState = async () => {
    const storyService = StoryService.getInstance();
    const state = storyService.getGameState();
    setGameState(state);
  };

  const getPlayTime = (): string => {
    if (!gameState) return '0m';
    
    const start = new Date(gameState.gameStarted);
    const last = new Date(gameState.lastPlayed);
    const diff = last.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRelationshipStatus = (characterId: string): string => {
    if (!gameState) return 'Unknown';
    
    const score = gameState.relationshipScores[characterId] || 0;
    if (score >= 15) return 'Very Close';
    if (score >= 10) return 'Close';
    if (score >= 5) return 'Friendly';
    if (score >= 0) return 'Neutral';
    if (score >= -5) return 'Distant';
    return 'Hostile';
  };

  const getRelationshipColor = (characterId: string): string => {
    if (!gameState) return '#999';
    
    const score = gameState.relationshipScores[characterId] || 0;
    if (score >= 10) return '#4CAF50';
    if (score >= 5) return '#8BC34A';
    if (score >= 0) return '#FFC107';
    if (score >= -5) return '#FF9800';
    return '#F44336';
  };

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading story progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const unlockedCharacters = Object.values(gameState.characters).filter(c => c.isUnlocked);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Story</Text>
          <Text style={styles.subtitle}>Progress & Relationships</Text>
        </View>

        {/* Progress Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Clock size={20} color="#4A90E2" />
              <Text style={styles.statValue}>{getPlayTime()}</Text>
              <Text style={styles.statLabel}>Play Time</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={20} color="#4A90E2" />
              <Text style={styles.statValue}>{unlockedCharacters.length}</Text>
              <Text style={styles.statLabel}>Contacts</Text>
            </View>
            <View style={styles.statItem}>
              <Trophy size={20} color="#4A90E2" />
              <Text style={styles.statValue}>{gameState.completedScenes.length}</Text>
              <Text style={styles.statLabel}>Scenes</Text>
            </View>
          </View>
        </View>

        {/* Relationships */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationships</Text>
          {unlockedCharacters.map((character) => (
            <View key={character.id} style={styles.relationshipItem}>
              <View style={styles.relationshipHeader}>
                <Text style={styles.characterName}>{character.name}</Text>
                <View style={[
                  styles.relationshipBadge,
                  { backgroundColor: getRelationshipColor(character.id) }
                ]}>
                  <Text style={styles.relationshipText}>
                    {getRelationshipStatus(character.id)}
                  </Text>
                </View>
              </View>
              <Text style={styles.characterDescription}>{character.description}</Text>
              <View style={styles.relationshipBar}>
                <View 
                  style={[
                    styles.relationshipFill,
                    { 
                      width: `${Math.max(0, Math.min(100, ((gameState.relationshipScores[character.id] || 0) + 20) * 2.5))}%`,
                      backgroundColor: getRelationshipColor(character.id)
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        {/* Story Synopsis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Synopsis</Text>
          <Text style={styles.synopsis}>
            You've discovered that your alternate timeline self has mysteriously disappeared from this reality. 
            As you investigate the supernatural phenomena affecting your town, you're building relationships 
            with various characters who may hold the key to understanding what happened.
          </Text>
          <Text style={styles.synopsis}>
            Each conversation shapes your relationships and influences how the story unfolds. 
            Your choices will determine which of the five possible endings you'll experience.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
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
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  relationshipItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  relationshipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Inter-SemiBold',
  },
  relationshipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relationshipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  characterDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  relationshipBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  relationshipFill: {
    height: '100%',
    borderRadius: 2,
  },
  synopsis: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
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