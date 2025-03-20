// src/providers/app-provider.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AppContext, AppContextType } from '@/types/app-context';
import { useToast } from '@/components/ui/use-toast';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Application Provider component
 * Manages global application state and provides methods to interact with it
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const isMobileView = useMediaQuery('(max-width: 768px)');
  
  // State management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [modalProps, setModalProps] = useState<any>(null);
  const [dialogProps, setDialogProps] = useState<any>(null);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Track route changes
  useEffect(() => {
    if (pathname) {
      setPreviousPath(pathname);
    }
  }, [pathname]);
  
  // Responsive sidebar behavior
  useEffect(() => {
    if (isMobileView && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isMobileView]);
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // In a real app, you would check session/token validity here
        const session = localStorage.getItem('session');
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Modal and Dialog handlers
  const openModal = useCallback((modalId: string, props?: any) => {
    setActiveModal(modalId);
    setModalProps(props || null);
  }, []);
  
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalProps(null);
  }, []);
  
  const openDialog = useCallback((dialogId: string, props?: any) => {
    setActiveDialog(dialogId);
    setDialogProps(props || null);
  }, []);
  
  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setDialogProps(null);
  }, []);
  
  // Sidebar handlers
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);
  
  // Toast handler
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === 'error' ? 'destructive' : 'default'
    });
  }, [toast]);
  
  // Auth handlers
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock login implementation - replace with actual auth logic
      if (email && password) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store session (in a real app, store JWT or session token)
        localStorage.setItem('session', JSON.stringify({ email }));
        
        setIsAuthenticated(true);
        showToast('Logged in successfully', 'success');
        return true;
      }
      
      showToast('Invalid credentials', 'error');
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      showToast('Login failed', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);
  
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Mock logout implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear session
      localStorage.removeItem('session');
      
      setIsAuthenticated(false);
      showToast('Logged out successfully', 'success');
      
      // Redirect to login
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      showToast('Logout failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [router, showToast]);
  
  // Error handlers
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextType>(() => ({
    // State
    isLoading,
    isAuthenticated,
    isMobile: isMobileView,
    sidebarCollapsed,
    activeModal,
    activeDialog,
    activePath: pathname || '/',
    previousPath,
    error,
    
    // Actions
    openModal,
    closeModal,
    openDialog,
    closeDialog,
    toggleSidebar,
    setSidebarCollapsed,
    showToast,
    login,
    logout,
    setError,
    clearError
  }), [
    isLoading, isAuthenticated, isMobileView, sidebarCollapsed,
    activeModal, activeDialog, pathname, previousPath, error,
    openModal, closeModal, openDialog, closeDialog,
    toggleSidebar, showToast, login, logout, setError, clearError
  ]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * HOC to wrap components with the AppProvider
 */
export function withAppProvider<T>(Component: React.ComponentType<T>) {
  const WithAppProvider = (props: T) => (
    <AppProvider>
      <Component {...props} />
    </AppProvider>
  );
  
  WithAppProvider.displayName = `WithAppProvider(${Component.displayName || Component.name || 'Component'})`;
  
  return WithAppProvider;
}