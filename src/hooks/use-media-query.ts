// src/hooks/use-media-query.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for responsive design breakpoint detection
 * 
 * @param query - CSS media query string e.g. '(max-width: 768px)'
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * const isDesktop = useMediaQuery('(min-width: 1025px)');
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    // Start with a safe check for window
    if (typeof window === 'undefined') return;
    
    // Create the media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial state based on the media query match
    setMatches(mediaQuery.matches);
    
    // Handler for match changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      // @ts-ignore - older browsers use deprecated .addListener()
      mediaQuery.addListener(handleChange);
      return () => {
        // @ts-ignore - older browsers use deprecated .removeListener()
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [query]);
  
  return matches;
}

/**
 * Presets for common breakpoints
 */
export const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  
  // Inverted (max-width) breakpoints
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  
  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Display features
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  reducedMotion: '(prefers-reduced-motion: reduce)'
};