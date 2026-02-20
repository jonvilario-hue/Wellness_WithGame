
'use client';

import { CognitiveEfficiency } from './cognitive-efficiency';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FullStrengthProfile } from './full-strength-profile';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';
import { ChcProfileOverview } from './chc-profile-overview';

export function MainDashboardView() {
  const { organicGrowth } = useTheme();

  return (
    <div className="space-y-6">
      <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
        {organicGrowth && <GrowthDecoration />}
        <CardHeader>
          <CardTitle className="font-headline">Performance Overview</CardTitle>
          <CardDescription>A high-level look at your progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChcProfileOverview />
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
        {organicGrowth && <GrowthDecoration />}
        <CardHeader>
          <CardTitle className="font-headline">Performance Index</CardTitle>
          <CardDescription>Your complexity-adjusted performance trend.</CardDescription>
        </CardHeader>
        <CardContent>
          <CognitiveEfficiency />
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
        {organicGrowth && <GrowthDecoration />}
        <CardHeader>
          <CardTitle className="font-headline">My Full Strength</CardTitle>
          <CardDescription>A holistic overview of your domain strengths.</CardDescription>
        </CardHeader>
        <CardContent>
          <FullStrengthProfile />
        </CardContent>
      </Card>
    </div>
  );
}
