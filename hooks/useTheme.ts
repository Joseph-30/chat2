import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'APP_THEME';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  card: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
}

const lightTheme: ThemeColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  primary: '#4A90E2',
  secondary: '#6c757d',
  text: '#000000',
  textSecondary: '#666666',
  border: '#f0f0f0',
  accent: '#e74c3c',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  card: '#ffffff',
  tabBar: '#ffffff',
  tabBarActive: '#4A90E2',
  tabBarInactive: '#999999',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  primary: '#6BB6FF',
  secondary: '#8e8e93',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#2c2c2e',
  accent: '#ff6b6b',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  card: '#2c2c2e',
  tabBar: '#1c1c1e',
  tabBarActive: '#6BB6FF',
  tabBarInactive: '#8e8e93',
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [colors, setColors] = useState<ThemeColors>(darkTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    setColors(theme === 'dark' ? darkTheme : lightTheme);
  }, [theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return {
    theme,
    colors,
    toggleTheme,
    isDark: theme === 'dark',
  };
}