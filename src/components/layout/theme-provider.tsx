// src/components/layout/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/setting-store';
import React from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'noteflash-ui-theme',
  attribute = 'data-theme',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const { darkMode } = useSettingsStore();

  // Set theme based on darkMode setting
  useEffect(() => {
    setTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, disableTransitionOnChange, enableSystem]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
      
      // Update settings store for persistence
      useSettingsStore.getState().updateSettings({
        darkMode: theme === 'dark',
      });
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};