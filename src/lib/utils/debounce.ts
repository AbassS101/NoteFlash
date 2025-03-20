// src/lib/utils/debounce.ts

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the original function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: Parameters<T>): void {
      const later = () => {
        timeout = null;
        func(...args);
      };
      
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Creates a throttled function that only invokes the provided function
   * at most once per every specified wait milliseconds.
   * 
   * @param func The function to throttle
   * @param wait The number of milliseconds to throttle invocations to
   * @returns A throttled version of the original function
   */
  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    let previous = 0;
    
    return function(...args: Parameters<T>): void {
      const now = Date.now();
      const remaining = wait - (now - previous);
      
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func(...args);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          previous = Date.now();
          timeout = null;
          func(...args);
        }, remaining);
      }
    };
  }