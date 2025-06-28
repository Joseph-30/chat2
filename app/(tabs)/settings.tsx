import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryService } from '../../services/storyService';
import { Trash2, Download, Moon, Sun, Volume2, VolumeX } from 'lucide-react-native';

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

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
            const storyService = StoryService.getInstance();
            await storyService.resetGame();
            Alert.alert('Game Reset', 'Your progress has been reset. Please restart the app.');
          },
        },
      ]
    );
  };

  const handleExportSave = () => {
    Alert.alert(
      'Export Save',
      'This feature will be available in a future update. Your progress is automatically saved locally.',
      [{ text: 'OK' }]
    );
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    Alert.alert('Dark Mode', 'Theme changes will be applied in a future update.');
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
    Alert.alert('Sound', 'Audio settings will be implemented in a future update.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Game Preferences</Text>
        </View>

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          
          <Pressable style={styles.settingItem} onPress={toggleSound}>
            <View style={styles.settingLeft}>
              {isSoundEnabled ? (
                <Volume2 size={20} color="#4A90E2" />
              ) : (
                <VolumeX size={20} color="#666" />
              )}
              <Text style={styles.settingText}>Sound Effects</Text>
            </View>
            <Text style={styles.settingValue}>
              {isSoundEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </Pressable>

          <Pressable style={styles.settingItem} onPress={toggleDarkMode}>
            <View style={styles.settingLeft}>
              {isDarkMode ? (
                <Moon size={20} color="#4A90E2" />
              ) : (
                <Sun size={20} color="#4A90E2" />
              )}
              <Text style={styles.settingText}>Theme</Text>
            </View>
            <Text style={styles.settingValue}>
              {isDarkMode ? 'Dark' : 'Light'}
            </Text>
          </Pressable>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Pressable style={styles.settingItem} onPress={handleExportSave}>
            <View style={styles.settingLeft}>
              <Download size={20} color="#4A90E2" />
              <Text style={styles.settingText}>Export Save</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.settingItem, styles.dangerItem]} onPress={handleResetGame}>
            <View style={styles.settingLeft}>
              <Trash2 size={20} color="#e74c3c" />
              <Text style={[styles.settingText, styles.dangerText]}>Reset Game</Text>
            </View>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            This is an interactive story game where your choices shape the narrative. 
            Explore supernatural mysteries, build relationships, and discover multiple endings.
          </Text>
          <Text style={styles.aboutText}>
            The story adapts to your decisions using AI-powered content generation, 
            ensuring each playthrough feels unique and engaging.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Play</Text>
          <Text style={styles.instructionText}>
            • Tap on unlocked contacts to start conversations
          </Text>
          <Text style={styles.instructionText}>
            • Choose from multiple response options to shape the story
          </Text>
          <Text style={styles.instructionText}>
            • Build relationships by making choices that align with characters
          </Text>
          <Text style={styles.instructionText}>
            • New contacts unlock as you progress through the story
          </Text>
          <Text style={styles.instructionText}>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  dangerItem: {
    borderBottomColor: 'transparent',
  },
  dangerText: {
    color: '#e74c3c',
  },
  aboutText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Inter-Regular',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
});