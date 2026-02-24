
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

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// This component ensures that the performance data is loaded from IndexedDB
// into the Zustand store when the application starts.
function StoreHydrator({ children }: { children: React.ReactNode }) {
  const { isHydrated, hydrate } = usePerformanceStore();

  useEffect(() => {
    // This effect runs once on the client to hydrate the store.
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

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
            <TrainingFocusProvider>
              <TrainingOverrideProvider>
                {children}
                <Toaster />
              </TrainingOverrideProvider>
            </TrainingFocusProvider>
          </ThemeProvider>
        </StoreHydrator>
      </body>
    </html>
  );
}

// We can no longer export metadata statically because this is a client component.
// export const metadata: Metadata = {
//   title: 'Cognitive Crucible',
//   description: 'A collection of games to sharpen your mind.',
// };
