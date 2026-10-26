import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  inputBg: string;
  inputBorder: string;
  divider: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
  modalOverlay: string;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDark: '#3730A3',
  success: '#059669',
  successLight: '#ECFDF5',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  divider: '#E2E8F0',
  chipBg: '#F1F5F9',
  chipBorder: '#E2E8F0',
  chipText: '#475569',
  modalOverlay: 'rgba(15, 23, 42, 0.45)',
  isDark: false,
};

const darkColors: ThemeColors = {
  background: '#0B0F17',
  surface: '#151D2A',
  surfaceSecondary: '#1E293B',
  card: '#151D2A',
  cardBorder: '#253347',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#6366F1',
  primaryLight: '#232946',
  primaryDark: '#4F46E5',
  success: '#10B981',
  successLight: '#064E3B',
  danger: '#EF4444',
  dangerLight: '#450A0A',
  warning: '#F59E0B',
  warningLight: '#451A03',
  inputBg: '#0B0F17',
  inputBorder: '#334155',
  divider: '#253347',
  chipBg: '#1E293B',
  chipBorder: '#334155',
  chipText: '#CBD5E1',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  isDark: true,
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const THEME_STORAGE_KEY = '@hrcc_theme_preference';

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
        }
      } catch (err) {
        console.warn('Failed to load theme preference:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const isDark =
    themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

  const toggleTheme = async () => {
    const nextMode = isDark ? 'light' : 'dark';
    setThemeModeState(nextMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  };

  const setThemeMode = async (mode: 'light' | 'dark' | 'system') => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
