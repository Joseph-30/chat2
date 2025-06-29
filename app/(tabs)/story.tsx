import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryService } from '../../services/storyService';
import { GameState } from '../../types/story';
import { Heart, Users, Clock, Trophy, Lock } from 'lucide-react-native';
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
                {(() => {
                  const storyService = StoryService.getInstance();
                  const relationshipLevel = gameState.relationshipScores[character.id] || 0;
                  const paywallCheck = storyService.checkRelationshipPaywall(character.id, relationshipLevel);
                  const isLocked = paywallCheck.isLocked && !storyService.hasPremiumAccess();
                  
                  return (
                    <>
                      <View style={styles.relationshipHeader}>
                        <Text style={[styles.characterName, { color: colors.text }]}>{character.name}</Text>
                        <View style={styles.badgeContainer}>
                          {isLocked && (
                            <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
                              <Lock size={10} color="#fff" />
                              <Text style={styles.premiumText}>Premium</Text>
                            </View>
                          )}
                          <View style={[
                            styles.relationshipBadge,
                            { backgroundColor: getRelationshipColor(character.id) }
                          ]}>
                            <Text style={styles.relationshipText}>
                              {getRelationshipStatus(character.id)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.characterDescription, { color: colors.textSecondary }]}>
                        {character.description}
                        {isLocked && (
                          <Text style={[styles.premiumNote, { color: colors.accent }]}>
                            {' '}• Premium required for deeper relationship
                          </Text>
                        )}
                      </Text>
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
                        {isLocked && (
                          <View style={[styles.relationshipOverlay, { backgroundColor: colors.accent + '40' }]}>
                            <Lock size={12} color={colors.accent} />
                          </View>
                        )}
                      </View>
                    </>
                  );
                })()}
              </View>
            ))}
          </View>

          {/* Premium Features Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium Features</Text>
            <View style={[styles.premiumContainer, { backgroundColor: colors.background, borderColor: colors.accent }]}>
              <Text style={[styles.premiumTitle, { color: colors.accent }]}>Unlock the Full Story</Text>
              <Text style={[styles.premiumDescription, { color: colors.textSecondary }]}>
                Get access to deeper relationships, exclusive romantic content, and multiple story endings.
              </Text>
              <View style={styles.premiumFeatures}>
                <Text style={[styles.premiumFeature, { color: colors.textSecondary }]}>• Unlimited relationship progression</Text>
                <Text style={[styles.premiumFeature, { color: colors.textSecondary }]}>• Exclusive romantic storylines</Text>
                <Text style={[styles.premiumFeature, { color: colors.textSecondary }]}>• Multiple story endings</Text>
                <Text style={[styles.premiumFeature, { color: colors.textSecondary }]}>• Priority AI responses</Text>
              </View>
              <Pressable 
                style={[styles.premiumButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  Alert.alert(
                    'Coming Soon',
                    'Premium features will be available soon! We\'re working on integrating secure payment processing.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              </Pressable>
            </View>
          </View>

          {/* Story Synopsis */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Story Synopsis</Text>
            <Text style={[styles.synopsis, { color: colors.textSecondary }]}>
              You've discovered that your alternate timeline self has mysteriously vanished from this reality. 
              As you investigate their disappearance, you uncover a web of supernatural phenomena plaguing the town. 
              Strange temporal anomalies, unexplained disappearances, and cryptic messages from unknown contacts 
              suggest something far more sinister is at work.
            </Text>
            <Text style={[styles.synopsis, { color: colors.textSecondary }]}>
              Your choices determine not only the fate of the missing person, but also the relationships you build 
              with those who might hold the key to solving this mystery. Trust carefully - in a world where reality 
              itself seems unstable, allies and enemies may not be what they appear.
            </Text>
          </View>

          {/* Story Progression */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Story Progression</Text>
            <View style={styles.progressionContainer}>
              <View style={[styles.progressionItem, { backgroundColor: colors.background }]}>
                <View style={[styles.progressionHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.progressionTitle, { color: colors.text }]}>Chapter {gameState.currentChapter}</Text>
                  <Text style={[styles.progressionStatus, { color: colors.primary }]}>In Progress</Text>
                </View>
                <Text style={[styles.progressionDescription, { color: colors.textSecondary }]}>
                  {gameState.currentChapter === 1 && "The Investigation Begins - You've started uncovering the mystery of your alternate self's disappearance."}
                  {gameState.currentChapter === 2 && "Deeper Mysteries - The supernatural elements become more apparent as you dig deeper."}
                  {gameState.currentChapter === 3 && "Dangerous Revelations - The truth behind the disappearances starts to emerge."}
                  {gameState.currentChapter === 4 && "The Final Confrontation - All mysteries converge as you face the ultimate truth."}
                  {gameState.currentChapter >= 5 && "Resolution - The consequences of your choices determine the ending."}
                </Text>
              </View>
              
              {/* Atmosphere Meters */}
              <View style={styles.atmosphereContainer}>
                <Text style={[styles.atmosphereTitle, { color: colors.text }]}>Story Atmosphere</Text>
                
                <View style={[styles.atmosphereItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.atmosphereLabel, { color: colors.text }]}>Mystery Level</Text>
                  <View style={[styles.atmosphereBar, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.atmosphereFill,
                      { 
                        width: `${Math.min(100, (gameState.completedScenes.length * 15) + 30)}%`,
                        backgroundColor: '#9C27B0'
                      }
                    ]} />
                  </View>
                </View>

                <View style={[styles.atmosphereItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.atmosphereLabel, { color: colors.text }]}>Supernatural Activity</Text>
                  <View style={[styles.atmosphereBar, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.atmosphereFill,
                      { 
                        width: `${Math.min(100, (gameState.completedScenes.length * 12) + 20)}%`,
                        backgroundColor: '#E91E63'
                      }
                    ]} />
                  </View>
                </View>

                <View style={[styles.atmosphereItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.atmosphereLabel, { color: colors.text }]}>Danger Level</Text>
                  <View style={[styles.atmosphereBar, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.atmosphereFill,
                      { 
                        width: `${Math.min(100, (gameState.completedScenes.length * 10) + 15)}%`,
                        backgroundColor: '#F44336'
                      }
                    ]} />
                  </View>
                </View>

                <View style={[styles.atmosphereItem, { backgroundColor: colors.background }]}>
                  <Text style={[styles.atmosphereLabel, { color: colors.text }]}>Romance Potential</Text>
                  <View style={[styles.atmosphereBar, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.atmosphereFill,
                      { 
                        width: `${Math.min(100, Math.max(...Object.values(gameState.relationshipScores || {}), 0) * 4)}%`,
                        backgroundColor: '#E91E63'
                      }
                    ]} />
                  </View>
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
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
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
  premiumNote: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Inter-Regular',
  },
  relationshipBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  relationshipFill: {
    height: '100%',
    borderRadius: 2,
  },
  relationshipOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  premiumDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  premiumFeatures: {
    marginBottom: 16,
  },
  premiumFeature: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  premiumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  premiumButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  synopsis: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  progressionContainer: {
    gap: 16,
  },
  progressionItem: {
    padding: 16,
    borderRadius: 12,
  },
  progressionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  progressionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  progressionStatus: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-SemiBold',
  },
  progressionDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  atmosphereTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
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