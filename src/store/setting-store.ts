// src/store/settings-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  darkMode: boolean;
  autoSave: boolean;
  fontSize: 'small' | 'medium' | 'large';
  spacedRepetition: boolean;
  reviewLimit: number;
  autoGenerate: boolean;
  shuffleQuestions: boolean;
  showAnswers: boolean;
  updateSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      autoSave: true,
      fontSize: 'medium',
      spacedRepetition: true,
      reviewLimit: 50,
      autoGenerate: false,
      shuffleQuestions: true,
      showAnswers: true,
      
      updateSettings: (newSettings) => {
        set(state => ({
          ...state,
          ...newSettings
        }));
      },
    }),
    {
      name: 'noteflash-settings',
    }
  )
);