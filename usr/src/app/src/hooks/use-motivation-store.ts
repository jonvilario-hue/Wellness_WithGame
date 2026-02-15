
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { messages, type MessageTrigger } from '@/data/motivational-messages';
import { useHydratedJournalStore } from './use-journal';
import { usePomodoroStore } from './use-pomodoro-store';


type MotivationState = {
  message: string | null;
  isVisible: boolean;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  selectMessage: () => void;
  hideMessage: () => void;
  showMessage: (message: string) => void;
};

const getRandomMessage = (trigger: MessageTrigger): string => {
  const categoryMessages = messages[trigger];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
};

// Determines the most relevant message based on a data-driven priority
const determineMessageTrigger = (): MessageTrigger => {
  try {
    // Check for recent activity based on stores
    const { getTodaysEntry } = useHydratedJournalStore.getState();
    const { lastSessionDate } = usePomodoroStore.getState();
    const today = new Date().toISOString().split('T')[0];

    if (getTodaysEntry()) {
      return 'journal_used';
    }
    if (lastSessionDate === today) {
      return 'focus_used';
    }
  } catch (e) {
    // This can happen on the server, it's safe to ignore.
  }
  
  // 1. Time of Day
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour > 18) return 'evening';
  
  // 2. Default Fallback
  return 'no_activity';
};

export const useMotivationStore = create<MotivationState>()(
  persist(
    (set, get) => ({
      message: null,
      isVisible: false,
      notificationsEnabled: true,

      toggleNotifications: () => {
        set(state => ({ notificationsEnabled: !state.notificationsEnabled }));
      },
      
      selectMessage: () => {
        // Only show a new message if notifications are enabled and the current one is not visible
        if (get().notificationsEnabled && !get().isVisible) {
          const trigger = determineMessageTrigger();
          const newMessage = getRandomMessage(trigger);
          set({ message: newMessage, isVisible: true });
        }
      },

      hideMessage: () => {
        set({ isVisible: false });
      },

      showMessage: (message) => {
        if (get().notificationsEnabled) {
          set({ message, isVisible: true });
        }
      },
    }),
    {
      name: 'motivation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notificationsEnabled: state.notificationsEnabled }),
    }
  )
);
