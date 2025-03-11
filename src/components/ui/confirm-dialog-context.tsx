// src/components/ui/confirm-dialog-context.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Interface with all properties required for internal state
interface ConfirmDialogState {
  title: string;
  description: string;
  cancelText: string;
  confirmText: string;
}

// Interface for the options passed by the user (with optional properties)
export interface ConfirmDialogOptions {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmDialogProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Default state with all required properties
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    title: '',
    description: '',
    cancelText: 'Cancel',
    confirmText: 'Continue'
  });
  
  // State to store the promise resolver
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  // Function to show the confirmation dialog
  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    // Create a copy with all required properties
    const completeOptions: ConfirmDialogState = {
      title: options.title,
      description: options.description,
      cancelText: options.cancelText || 'Cancel',
      confirmText: options.confirmText || 'Continue'
    };
    
    // Update dialog state with complete options
    setDialogState(completeOptions);
    setIsOpen(true);
    
    // Return a promise that will be resolved when the dialog is closed
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  // Handle confirm action
  const handleConfirm = useCallback(() => {
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
    setIsOpen(false);
  }, [resolver]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
    setIsOpen(false);
  }, [resolver]);

  // Handle dialog open change
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) handleCancel();
    setIsOpen(open);
  }, [handleCancel]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent className={undefined}>
          <AlertDialogHeader className={undefined}>
            <AlertDialogTitle className={undefined}>{dialogState.title}</AlertDialogTitle>
            <AlertDialogDescription className={undefined}>{dialogState.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={undefined}>
            <AlertDialogCancel onClick={handleCancel} className={undefined}>
              {dialogState.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className={undefined}>
              {dialogState.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

// Custom hook to use the confirm function
export function useConfirm() {
  const context = useContext(ConfirmContext);
  
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  
  return context.confirm;
}