
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/hooks/use-theme';
import { TrainingFocusProvider } from '@/hooks/use-training-focus';
import { TrainingOverrideProvider } from '@/hooks/use-training-override.tsx';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Cognitive Crucible',
  description: 'A collection of games to sharpen your mind.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <TrainingFocusProvider>
            <TrainingOverrideProvider>
              {children}
              <Toaster />
            </TrainingOverrideProvider>
          </TrainingFocusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
