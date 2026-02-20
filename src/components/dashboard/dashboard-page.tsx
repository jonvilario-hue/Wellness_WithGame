
'use client';

import { Header } from '@/components/header';
import { MotivationalMessage } from '@/components/motivational-message';
import { DashboardLayout } from './dashboard-layout';

export function DashboardPage() {
  return (
    <>
      <div className="sticky top-0 z-20">
        <Header />
      </div>
      <MotivationalMessage />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DashboardLayout />
      </main>
    </>
  );
}
