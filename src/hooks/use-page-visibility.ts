
'use client';

import { useState, useEffect } from 'react';

/**
 * A hook to track page visibility state using the Page Visibility API.
 * This is crucial for pausing timers or game logic when the user switches tabs.
 * @returns `true` if the page is visible, `false` otherwise.
 */
export const usePageVisibility = (): boolean => {
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};
