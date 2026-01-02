import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationSettings {
  workoutReminders: boolean;
  reminderTime: string; // HH:MM format
  achievementAlerts: boolean;
  supplementReminders: boolean;
}

interface SettingsState {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  notifications: NotificationSettings;
  guidedModeEnabled: boolean;
  restTimerSeconds: number;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSound: () => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  toggleGuidedMode: () => void;
  setRestTimer: (seconds: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      soundEnabled: true,
      notifications: {
        workoutReminders: true,
        reminderTime: '18:00',
        achievementAlerts: true,
        supplementReminders: true,
      },
      guidedModeEnabled: false,
      restTimerSeconds: 60,
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      updateNotifications: (settings) => 
        set((state) => ({ 
          notifications: { ...state.notifications, ...settings } 
        })),
      toggleGuidedMode: () => set((state) => ({ guidedModeEnabled: !state.guidedModeEnabled })),
      setRestTimer: (seconds) => set({ restTimerSeconds: seconds }),
    }),
    {
      name: 'zoefit-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);
