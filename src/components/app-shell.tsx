
'use client';

import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow pb-16"> 
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
