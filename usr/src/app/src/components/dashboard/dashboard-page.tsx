
'use client';

import { Header } from '@/components/header';
import { MotivationalMessage } from '@/components/motivational-message';
import { PageSpecificSettings } from '@/components/page-specific-settings';
import { dashboardLayoutKeys } from '@/hooks/use-dashboard-settings';
import { DashboardLayout } from './dashboard-layout';
import { PageNav } from '@/components/page-nav';

export function DashboardPage() {
  return (
    <>
      <div className="sticky top-0 z-20">
        <Header />
        <PageNav />
      </div>
      <MotivationalMessage />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DashboardLayout />
      </main>
      <PageSpecificSettings settingsKeys={dashboardLayoutKeys} />
    </>
  );
}
