
'use client';

import { useState, useEffect, useCallback } from 'react';

const defaultSettings = {
  performanceOverview: true,
  dailyChallenge: true,
  allGames: true,
  weakAreaRecommendations: true,
  adaptiveDifficulty: true,
  hyperfocusBuilder: true,
  performanceInsights: true,
};

export type DashboardSettings = typeof defaultSettings;
export type DashboardComponent = keyof DashboardSettings;

const DASHBOARD_SETTINGS_KEY = 'dashboardSettings-v3-stripped';

export const useDashboardSettings = () => {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedSettingsStr = window.localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (savedSettingsStr) {
        const savedSettings = JSON.parse(savedSettingsStr);
        // Ensure all keys from defaultSettings are present
        const mergedSettings = { ...defaultSettings, ...savedSettings };
        setSettings(mergedSettings);
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Failed to load dashboard settings from localStorage", error);
      setSettings(defaultSettings);
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = useCallback((newSettings: DashboardSettings) => {
    try {
      setSettings(newSettings);
      window.localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save dashboard settings to localStorage", error);
    }
  }, []);

  const toggleSetting = useCallback((component: keyof DashboardSettings) => {
    saveSettings({
      ...settings,
      [component]: !settings[component],
    });
  }, [settings, saveSettings]);

  const resetSettings = useCallback(() => {
    saveSettings(defaultSettings);
  }, [saveSettings]);

  return { settings, toggleSetting, resetSettings, isLoaded };
};

export const componentLabels: Record<keyof DashboardSettings, string> = {
  performanceOverview: 'Performance Overview',
  dailyChallenge: 'Daily Challenge',
  allGames: 'All Training Games',
  hyperfocusBuilder: 'Hyperfocus Builder',
  performanceInsights: 'Performance Insights',
  weakAreaRecommendations: 'Weak Area Targeting',
  adaptiveDifficulty: 'Adaptive Difficulty',
};

// Keys for the main dashboard page
export const dashboardLayoutKeys: DashboardComponent[] = [
    'performanceOverview',
    'dailyChallenge',
    'allGames',
    'performanceInsights',
    'weakAreaRecommendations',
    'adaptiveDifficulty',
    'hyperfocusBuilder',
];
