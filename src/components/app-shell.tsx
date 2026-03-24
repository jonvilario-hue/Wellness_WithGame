'use client';

import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <BottomNav />
      <div className="flex-grow"> 
        {children}
      </div>
    </div>
  );
}
