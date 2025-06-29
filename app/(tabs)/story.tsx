import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryService } from '../../services/storyService';
import { GameState } from '../../types/story';
import { Heart, Users, Clock, Trophy } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export default function StoryScreen() {
  const { colors } = useTheme();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const pulseAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for stats
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Rotation animation for trophy
    rotateAnim.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    loadGameState();
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

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

  const unlockedCharacters = gameState ? Object.values(gameState.characters).filter(c => c.isUnlocked) : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {!gameState ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading story progress...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Your Story</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Progress & Relationships</Text>
          </View>

          {/* Progress Stats */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Progress</Text>
            <View style={styles.statsContainer}>
              <Animated.View style={[styles.statItem, pulseStyle]}>
                <Clock size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{getPlayTime()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Play Time</Text>
              </Animated.View>
              <Animated.View style={[styles.statItem, pulseStyle]}>
                <Users size={20} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{unlockedCharacters.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Contacts</Text>
              </Animated.View>
              <Animated.View style={[styles.statItem, rotateStyle]}>
                <Trophy size={20} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.text }]}>{gameState.completedScenes.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Scenes</Text>
              </Animated.View>
            </View>
          </View>

          {/* Relationships */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Relationships</Text>
            {unlockedCharacters.map((character) => (
              <View key={character.id} style={[styles.relationshipItem, { borderBottomColor: colors.border }]}>
                <View style={styles.relationshipHeader}>
                  <Text style={[styles.characterName, { color: colors.text }]}>{character.name}</Text>
                  <View style={[
                    styles.relationshipBadge,
                    { backgroundColor: getRelationshipColor(character.id) }
                  ]}>
                    <Text style={styles.relationshipText}>
                      {getRelationshipStatus(character.id)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.characterDescription, { color: colors.textSecondary }]}>{character.description}</Text>
                <View style={[styles.relationshipBar, { backgroundColor: colors.border }]}>
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
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Story Synopsis</Text>
            <Text style={[styles.synopsis, { color: colors.textSecondary }]}>
              You've discovered that your alternate timeline self has mysteriously disappeared from this reality. 
              As you investigate the supernatural phenomena affecting your town, you're building relationships 
              with various characters who may hold the key to understanding what happened.
            </Text>
            <Text style={[styles.synopsis, { color: colors.textSecondary }]}>
              Each conversation shapes your relationships and influences how the story unfolds. 
              Your choices will determine which of the five possible endings you'll experience.
            </Text>
          </View>

          {/* Story Atmosphere */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Atmosphere</Text>
            <View style={styles.atmosphereContainer}>
              <View style={[styles.atmosphereItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.atmosphereLabel, { color: colors.textSecondary }]}>Mystery Level</Text>
                <View style={[styles.atmosphereBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.atmosphereFill, { width: '75%', backgroundColor: colors.primary }]} />
                </View>
              </View>
              <View style={[styles.atmosphereItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.atmosphereLabel, { color: colors.textSecondary }]}>Supernatural Activity</Text>
                <View style={[styles.atmosphereBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.atmosphereFill, { width: '60%', backgroundColor: colors.accent }]} />
                </View>
              </View>
              <View style={[styles.atmosphereItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.atmosphereLabel, { color: colors.textSecondary }]}>Romance Tension</Text>
                <View style={[styles.atmosphereBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.atmosphereFill, { width: '45%', backgroundColor: colors.success }]} />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  section: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginTop: 4,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  relationshipItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  relationshipBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  relationshipFill: {
    height: '100%',
    borderRadius: 2,
  },
  synopsis: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  atmosphereContainer: {
    gap: 12,
  },
  atmosphereItem: {
    padding: 12,
    borderRadius: 8,
  },
  atmosphereLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  atmosphereBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  atmosphereFill: {
    height: '100%',
    borderRadius: 3,
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
});