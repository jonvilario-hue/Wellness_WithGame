
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/hooks/use-theme';
import { TrainingFocusProvider } from '@/hooks/use-training-focus';
import { TrainingOverrideProvider } from '@/hooks/use-training-override.tsx';
import { useEffect } from 'react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { AudioEngineProvider } from '@/hooks/useAudioEngine';
import { AppShell } from '@/components/app-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// This component ensures that the performance data is loaded from IndexedDB
// into the Zustand store when the application starts. It also handles
// flushing unsaved data when the page is hidden.
function StoreHydrator({ children }: { children: React.ReactNode }) {
  const { isHydrated, hydrate, flushFailedWrites } = usePerformanceStore();

  useEffect(() => {
    // This effect runs once on the client to hydrate the store.
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // The user is navigating away or switching tabs.
        // Flush any pending telemetry to prevent data loss.
        flushFailedWrites();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Also flush on page unload for robustness
    window.addEventListener('pagehide', flushFailedWrites);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushFailedWrites);
    };
  }, [flushFailedWrites]);


  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <StoreHydrator>
          <ThemeProvider>
            <AudioEngineProvider>
              <TrainingFocusProvider>
                <TrainingOverrideProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                  <Toaster />
                </TrainingOverrideProvider>
              </TrainingFocusProvider>
            </AudioEngineProvider>
          </ThemeProvider>
        </StoreHydrator>
      </body>
    </html>
  );
}
