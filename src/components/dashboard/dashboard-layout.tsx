
'use client';

import { DailyChallenge } from '@/components/dashboard/daily-challenge';
import { AllGames } from '@/components/dashboard/all-games';
import { PerformanceInsights } from '@/components/dashboard/performance-insights';
import { WeakAreaRecommendations } from '@/components/dashboard/weak-area-recommendations';
import { AdaptiveDifficulty } from '@/components/dashboard/adaptive-difficulty';
import { MainDashboardView } from '@/components/dashboard/main-dashboard-view';
import { HyperfocusBuilder } from '@/components/dashboard/hyperfocus-builder';

export function DashboardLayout() {
  return (
    <div className="space-y-6">
      <DailyChallenge />
      <AllGames />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MainDashboardView />
        </div>
        
        <aside className="lg:col-span-1 flex flex-col gap-6">
          <PerformanceInsights />
          <WeakAreaRecommendations />
          <AdaptiveDifficulty />
          <HyperfocusBuilder />
        </aside>
      </div>
    </div>
  );
}
