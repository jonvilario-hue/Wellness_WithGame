
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { themes, type Theme } from '@/data/themes';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  organicGrowth: boolean;
  setOrganicGrowth: (enabled: boolean) => void;
};

const defaultInitialTheme = themes.find((t) => t.key === 'focus') || themes[0];
const UI_SETTINGS_KEY = 'polymath-lab-ui-settings';

const initialState: ThemeProviderState = {
  theme: defaultInitialTheme,
  setTheme: () => null,
  organicGrowth: true,
  setOrganicGrowth: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultInitialTheme);
  const [organicGrowth, setOrganicGrowthState] = useState(true);

  useEffect(() => {
    // Load settings from localStorage on initial client render
    try {
      const savedSettings = window.localStorage.getItem(UI_SETTINGS_KEY);
      if (savedSettings) {
        const { themeKey, growthEnabled } = JSON.parse(savedSettings);
        const foundTheme = themes.find((t) => t.key === themeKey) || defaultInitialTheme;
        setThemeState(foundTheme);
        setOrganicGrowthState(typeof growthEnabled === 'boolean' ? growthEnabled : true);
      }
    } catch (e) {
      // Local storage not available or error parsing
      console.error("Failed to load UI settings from localStorage", e);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      const currentSettings = JSON.parse(window.localStorage.getItem(UI_SETTINGS_KEY) || '{}');
      const newSettings = { ...currentSettings, themeKey: newTheme.key };
      window.localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
        console.error("Failed to save theme setting", e);
    }
  }, []);
  
  const setOrganicGrowth = useCallback((enabled: boolean) => {
    setOrganicGrowthState(enabled);
     try {
      const currentSettings = JSON.parse(window.localStorage.getItem(UI_SETTINGS_KEY) || '{}');
      const newSettings = { ...currentSettings, growthEnabled: enabled };
      window.localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
        console.error("Failed to save organic growth setting", e);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('dark', 'light');
    root.classList.add(theme.colorScheme.isDark ? 'dark' : 'light');

    const themeColors = {
        '--theme-bg': theme.colorScheme.background,
        '--theme-panel': theme.colorScheme.panels,
        '--theme-text-primary': theme.colorScheme.textPrimary,
        '--theme-text-secondary': theme.colorScheme.textSecondary,
        '--theme-accent': theme.colorScheme.accent,
        '--theme-accent-fg': theme.colorScheme.accentForeground,
        '--theme-success': theme.colorScheme.success,
    };
    
    for (const [key, value] of Object.entries(themeColors)) {
        if (value) {
            root.style.setProperty(key, value);
        }
    }
    
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    organicGrowth,
    setOrganicGrowth,
  }), [theme, setTheme, organicGrowth, setOrganicGrowth]);

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
