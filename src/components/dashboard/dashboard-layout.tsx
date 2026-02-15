
'use client';

import { DailyChallenge } from '@/components/dashboard/daily-challenge';
import { AllGames } from '@/components/dashboard/all-games';
import { PerformanceInsights } from '@/components/dashboard/performance-insights';
import { WeakAreaRecommendations } from '@/components/dashboard/weak-area-recommendations';
import { AdaptiveDifficulty } from '@/components/dashboard/adaptive-difficulty';
import { MainDashboardView } from '@/components/dashboard/main-dashboard-view';
import { useDashboardSettings } from '@/hooks/use-dashboard-settings';
import { HyperfocusBuilder } from '@/components/dashboard/hyperfocus-builder';

export function DashboardLayout() {
  const { settings } = useDashboardSettings();

  return (
    <div className="space-y-6">
      {settings.dailyChallenge && <DailyChallenge />}
      {settings.allGames && <AllGames />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {settings.performanceOverview && <MainDashboardView />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.adaptiveDifficulty && <AdaptiveDifficulty />}
          </div>
        </div>
        
        <aside className="lg:col-span-1 flex flex-col gap-6">
          {settings.performanceInsights && <PerformanceInsights />}
          {settings.hyperfocusBuilder && <HyperfocusBuilder />}
          {settings.weakAreaRecommendations && <WeakAreaRecommendations />}
        </aside>
      </div>
    </div>
  );
}
