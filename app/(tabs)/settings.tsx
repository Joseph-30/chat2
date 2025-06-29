import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryService } from '../../services/storyService';
import { Trash2, Download, Moon, Sun, Volume2, VolumeX, LogOut, User, Edit3, Check, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { GameState } from '../../types/story';

// Platform-specific imports
let FileSystem: any = null;
let Sharing: any = null;

if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
}

export default function SettingsScreen() {
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [nameError, setNameError] = useState('');

  React.useEffect(() => {
    loadGameState();
  }, []);

  const loadGameState = async () => {
    const storyService = StoryService.getInstance();
    const state = storyService.getGameState();
    if (state) {
      setGameState(state);
      setNewPlayerName(state.playerName);
    }
  };

  const handleResetGame = () => {
    Alert.alert(
      'Reset Game',
      'Are you sure you want to reset your progress? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const storyService = StoryService.getInstance();
              await storyService.resetGame();
              Alert.alert(
                'Game Reset', 
                'Your progress has been reset successfully. Please restart the app to begin a new story.',
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Force app refresh by reloading the page (web) or showing restart message
                      if (Platform.OS === 'web') {
                        window.location.reload();
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Reset game error:', error);
              Alert.alert('Error', 'Failed to reset game. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportSave = async () => {
    setIsExporting(true);
    try {
      const storyService = StoryService.getInstance();
      const gameState = storyService.getGameState();
      
      if (!gameState) {
        Alert.alert('Error', 'No game data found to export.');
        return;
      }

      // Create export data
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        gameData: gameState,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `story_save_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web-specific implementation
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        URL.revokeObjectURL(url);
        
        Alert.alert('Success', 'Save file has been downloaded to your Downloads folder.');
      } else {
        // Native implementation (iOS/Android)
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Story Save',
          });
        } else {
          Alert.alert('Success', `Save file exported to: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export save file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  const handleEditName = () => {
    if (gameState) {
      setNewPlayerName(gameState.playerName);
      setNameError('');
      setShowNameModal(true);
    }
  };

  const handleSaveName = async () => {
    const trimmedName = newPlayerName.trim();
    
    if (!trimmedName) {
      setNameError('Please enter your name');
      return;
    }
    
    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    
    if (trimmedName.length > 20) {
      setNameError('Name must be less than 20 characters');
      return;
    }

    try {
      const storyService = StoryService.getInstance();
      await storyService.updatePlayerName(trimmedName);
      
      // Update local state
      if (gameState) {
        setGameState({ ...gameState, playerName: trimmedName });
      }
      
      setShowNameModal(false);
      setNameError('');
      Alert.alert('Success', 'Your name has been updated successfully!');
    } catch (error) {
      console.error('Failed to update player name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  const handleCancelNameEdit = () => {
    setShowNameModal(false);
    setNameError('');
    if (gameState) {
      setNewPlayerName(gameState.playerName);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? This will clear your current session but keep your saved progress.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear any session data but keep game progress
              // This is where you'd clear authentication tokens, etc.
              Alert.alert('Logged Out', 'You have been successfully logged out.');
              
              // Navigate back to login or restart app
              if (Platform.OS === 'web') {
                window.location.reload();
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Name Edit Modal */}
      <Modal
        visible={showNameModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Your Name</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                This name will be used throughout your story
              </Text>
            </View>

            <View style={styles.modalInputSection}>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    backgroundColor: colors.background,
                    borderColor: nameError ? colors.error : colors.border,
                    color: colors.text
                  }
                ]}
                value={newPlayerName}
                onChangeText={(text) => {
                  setNewPlayerName(text);
                  if (nameError) setNameError('');
                }}
                placeholder="Enter your name..."
                placeholderTextColor={colors.textSecondary}
                maxLength={20}
                autoFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              {nameError ? (
                <Text style={[styles.modalErrorText, { color: colors.error }]}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton, { backgroundColor: colors.background }]}
                onPress={handleCancelNameEdit}
              >
                <X size={16} color={colors.textSecondary} />
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.modalButton, 
                  styles.modalSaveButton,
                  { 
                    backgroundColor: newPlayerName.trim() ? colors.primary : colors.border,
                    opacity: newPlayerName.trim() ? 1 : 0.6
                  }
                ]}
                onPress={handleSaveName}
                disabled={!newPlayerName.trim()}
              >
                <Check size={16} color="#fff" />
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Game Preferences</Text>
        </View>

        {/* Game Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile & Game Settings</Text>
          
          {gameState && (
            <Pressable style={styles.settingItem} onPress={handleEditName}>
              <View style={styles.settingLeft}>
                <User size={20} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>Player Name</Text>
                  <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                    {gameState.playerName}
                  </Text>
                </View>
              </View>
              <Edit3 size={16} color={colors.textSecondary} />
            </Pressable>
          )}
          
          <Pressable style={styles.settingItem} onPress={toggleSound}>
            <View style={styles.settingLeft}>
              {isSoundEnabled ? (
                <Volume2 size={20} color={colors.primary} />
              ) : (
                <VolumeX size={20} color={colors.textSecondary} />
              )}
              <Text style={[styles.settingText, { color: colors.text }]}>Sound Effects</Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {isSoundEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </Pressable>

          <Pressable style={styles.settingItem} onPress={toggleTheme}>
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={20} color={colors.primary} />
              ) : (
                <Sun size={20} color={colors.primary} />
              )}
              <Text style={[styles.settingText, { color: colors.text }]}>Theme</Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {isDark ? 'Dark' : 'Light'}
            </Text>
          </Pressable>
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
          
          <Pressable 
            style={[styles.settingItem, isExporting && styles.disabledItem]} 
            onPress={handleExportSave}
            disabled={isExporting}
          >
            <View style={styles.settingLeft}>
              <Download size={20} color={isExporting ? colors.textSecondary : colors.primary} />
              <Text style={[styles.settingText, { color: isExporting ? colors.textSecondary : colors.text }]}>
                {isExporting ? 'Exporting...' : 'Export Save'}
              </Text>
            </View>
          </Pressable>

          <Pressable style={[styles.settingItem, styles.dangerItem]} onPress={handleResetGame}>
            <View style={styles.settingLeft}>
              <Trash2 size={20} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>Reset Game</Text>
            </View>
          </Pressable>
        </View>

        {/* Account Management */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          <Pressable style={[styles.settingItem, styles.dangerItem]} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <LogOut size={20} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>Log Out</Text>
            </View>
          </Pressable>
        </View>

        {/* About */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            This is an interactive story game where your choices shape the narrative. 
            Explore supernatural mysteries, build relationships, and discover multiple endings.
          </Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            The story adapts to your decisions using AI-powered content generation, 
            ensuring each playthrough feels unique and engaging.
          </Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        </View>

        {/* Instructions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Play</Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            • Tap on unlocked contacts to start conversations
          </Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            • Choose from multiple response options to shape the story
          </Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            • Build relationships by making choices that align with characters
          </Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            • New contacts unlock as you progress through the story
          </Text>
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            • Your choices determine which of five endings you'll experience
          </Text>
        </View>
      </ScrollView>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  settingSubtext: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  settingValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  disabledItem: {
    opacity: 0.5,
  },
  dangerItem: {
    marginTop: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  versionText: {
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInputSection: {
    marginBottom: 24,
  },
  modalInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  modalErrorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalSaveButton: {
    // No additional styles needed
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});