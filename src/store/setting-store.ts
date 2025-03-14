// src/store/setting-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SettingsState } from '@/types/store-types';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      autoSave: true,
      fontSize: 'medium',
      spacedRepetition: true,
      reviewLimit: 50,
      autoGenerate: false,
      shuffleQuiz: true,
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