// src/types/app-context.ts
import { createContext, useContext } from 'react';

/**
 * Application context interface that defines the shape of context data
 * This provides app-wide state and functions to be used across components
 */
export interface AppContextType {
  // App state
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // App preferences
  isMobile: boolean;
  sidebarCollapsed: boolean;
  
  // UI state control
  activeModal: string | null;
  activeDialog: string | null;
  
  // Navigation state
  activePath: string;
  previousPath: string | null;
  
  // Modal and dialog control
  openModal: (modalId: string, props?: any) => void;
  closeModal: () => void;
  openDialog: (dialogId: string, props?: any) => void;
  closeDialog: () => void;
  
  // Sidebar control
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Toast notifications
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Error handling
  setError: (error: Error | null) => void;
  clearError: () => void;
  error: Error | null;
}

/**
 * Default values for the application context
 */
export const defaultAppContext: AppContextType = {
  isLoading: false,
  isAuthenticated: false,
  isMobile: false,
  sidebarCollapsed: false,
  activeModal: null,
  activeDialog: null,
  activePath: '/',
  previousPath: null,
  openModal: () => {},
  closeModal: () => {},
  openDialog: () => {},
  closeDialog: () => {},
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
  showToast: () => {},
  login: async () => false,
  logout: async () => {},
  setError: () => {},
  clearError: () => {},
  error: null
};

/**
 * Application Context - provides app-wide state and functions
 */
export const AppContext = createContext<AppContextType>(defaultAppContext);

/**
 * Hook to use the application context
 * Use this in functional components to access app-wide state and functions
 * 
 * @example
 * const { isAuthenticated, login, logout } = useAppContext();
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};

// Re-export for namespace access
export namespace MyContext {
  export type Context = AppContextType;
}

// Alias for backward compatibility
export type MyContextType = AppContextType;