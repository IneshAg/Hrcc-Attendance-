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
  brandGreen: string;
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

// Light theme aligned with HackerRank Campus Crew SRM identity
const lightColors: ThemeColors = {
  background: '#F8FAF9',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0FDF4',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#090D0B',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  primary: '#049D57', // Contrast-optimized HackerRank Green for white canvas
  primaryLight: '#ECFDF5',
  primaryDark: '#037A44',
  brandGreen: '#05C770',
  success: '#05C770',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  divider: '#E5E7EB',
  chipBg: '#F0FDF4',
  chipBorder: '#D1FAE5',
  chipText: '#065F46',
  modalOverlay: 'rgba(9, 13, 11, 0.55)',
  isDark: false,
};

// Dark theme matching the official https://www.hrccsrm.xyz palette:
// Deep black (#070707), electric HackerRank green (#05C770 / #00c758), terminal red (#FF5F56), terminal amber (#FFBD2E), carbon surfaces (#111613), subtle forest-charcoal borders (#1F2E24)
const darkColors: ThemeColors = {
  background: '#070707',
  surface: '#111613',
  surfaceSecondary: '#161E19',
  card: '#111613',
  cardBorder: '#1F2E24',
  text: '#FFFFFF',
  textSecondary: '#99A1AF',
  textMuted: '#6B7280',
  primary: '#05C770', // Electric HackerRank Campus Crew Green
  primaryLight: 'rgba(5, 199, 112, 0.12)',
  primaryDark: '#04B264',
  brandGreen: '#05C770',
  success: '#05C770',
  successLight: 'rgba(5, 199, 112, 0.15)',
  danger: '#FF5F56', // Terminal Mac red from hrccsrm.xyz
  dangerLight: 'rgba(255, 95, 86, 0.15)',
  warning: '#FFBD2E', // Terminal Mac amber from hrccsrm.xyz
  warningLight: 'rgba(255, 189, 46, 0.15)',
  inputBg: '#0A0E0C',
  inputBorder: '#223328',
  divider: '#1F2E24',
  chipBg: '#161E19',
  chipBorder: '#233429',
  chipText: '#D1D5DB',
  modalOverlay: 'rgba(0, 0, 0, 0.85)',
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
  isDark: true, // Default to dark aesthetic matching hrccsrm.xyz
  colors: darkColors,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // By default, match the dark obsidian & green aesthetic of hrccsrm.xyz
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('dark');
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
