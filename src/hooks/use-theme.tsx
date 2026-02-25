'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { themes, type Theme } from '@/data/themes';
import { useTrainingFocus } from './use-training-focus';

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
  const [userSelectedTheme, setUserSelectedTheme] = useState<Theme>(defaultInitialTheme);
  const [organicGrowth, setOrganicGrowthState] = useState(true);
  const { focus: trainingFocus } = useTrainingFocus();

  const effectiveTheme = useMemo(() => {
    if (trainingFocus === 'logic') {
      return themes.find(t => t.key === 'challenge') || userSelectedTheme;
    }
    return userSelectedTheme;
  }, [trainingFocus, userSelectedTheme]);

  useEffect(() => {
    // Load user's preferred theme from localStorage on initial client render
    try {
      const savedSettings = window.localStorage.getItem(UI_SETTINGS_KEY);
      if (savedSettings) {
        const { themeKey, growthEnabled } = JSON.parse(savedSettings);
        const foundTheme = themes.find((t) => t.key === themeKey) || defaultInitialTheme;
        setUserSelectedTheme(foundTheme);
        setOrganicGrowthState(typeof growthEnabled === 'boolean' ? growthEnabled : true);
      }
    } catch (e) {
      console.error("Failed to load UI settings from localStorage", e);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setUserSelectedTheme(newTheme);
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
    root.classList.add(effectiveTheme.colorScheme.isDark ? 'dark' : 'light');

    const themeColors = {
        '--theme-bg': effectiveTheme.colorScheme.background,
        '--theme-panel': effectiveTheme.colorScheme.panels,
        '--theme-text-primary': effectiveTheme.colorScheme.textPrimary,
        '--theme-text-secondary': effectiveTheme.colorScheme.textSecondary,
        '--theme-accent': effectiveTheme.colorScheme.accent,
        '--theme-accent-fg': effectiveTheme.colorScheme.accentForeground,
        '--theme-success': effectiveTheme.colorScheme.success,
    };
    
    for (const [key, value] of Object.entries(themeColors)) {
        if (value) {
            root.style.setProperty(key, value);
        }
    }
    
  }, [effectiveTheme]);

  const value = useMemo(() => ({
    theme: effectiveTheme,
    setTheme,
    organicGrowth,
    setOrganicGrowth,
  }), [effectiveTheme, setTheme, organicGrowth, setOrganicGrowth]);

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
