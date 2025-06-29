import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryService } from '../../services/storyService';
import { Trash2, Download, Moon, Sun, Volume2, VolumeX } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

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
              Alert.alert('Game Reset', 'Your progress has been reset successfully.');
            } catch (error) {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Game Preferences</Text>
        </View>

        {/* Game Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Game Settings</Text>
          
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
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
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
});