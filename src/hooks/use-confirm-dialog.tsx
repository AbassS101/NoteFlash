// src/hooks/use-confirm-dialog.tsx
import React, { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'default',
    onConfirm: () => {},
  });

  const showConfirmDialog = useCallback((opts: ConfirmDialogOptions) => {
    setOptions({
      ...opts,
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel',
      confirmVariant: opts.confirmVariant || 'default',
    });
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    options.onConfirm();
    setIsOpen(false);
  }, [options]);

  const handleCancel = useCallback(() => {
    if (options.onCancel) {
      options.onCancel();
    }
    setIsOpen(false);
  }, [options]);

  const ConfirmDialog = useCallback(() => {
    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className={undefined}>
          <AlertDialogHeader className={undefined}>
            <AlertDialogTitle className={undefined}>{options.title}</AlertDialogTitle>
            <AlertDialogDescription className={undefined}>{options.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={undefined}>
            <AlertDialogCancel onClick={handleCancel} className={undefined}>
              {options.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction asChild className={undefined}>
              <Button variant={options.confirmVariant} onClick={handleConfirm} className={undefined} size={undefined}>
                {options.confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [isOpen, options, handleConfirm, handleCancel]);

  return {
    showConfirmDialog,
    ConfirmDialog,
  };
}