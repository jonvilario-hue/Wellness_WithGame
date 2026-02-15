
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CognitiveEfficiency } from './cognitive-efficiency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FullStrengthProfile } from './full-strength-profile';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';
import { ChcProfileOverview } from './chc-profile-overview';

export function MainDashboardView() {
  const [view, setView] = useState<'overview' | 'efficiency' | 'profile'>('overview');
  const { organicGrowth } = useTheme();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <Tabs defaultValue="overview" onValueChange={(value) => setView(value as any)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
              <CardTitle className="font-headline">
                  {view === 'overview' ? 'Performance Overview' : view === 'efficiency' ? 'Performance Index' : 'My Full Strength'}
              </CardTitle>
              <CardDescription>
                  {view === 'overview' ? 'A high-level look at your progress.' : view === 'efficiency' 
                      ? 'Your complexity-adjusted performance trend.' 
                      : 'A holistic overview of your domain strengths.'}
              </CardDescription>
          </div>
          <TooltipProvider>
              <TabsList className="grid grid-cols-3">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Summary of your overall performance.</p></TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="efficiency">Index</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Tracks your speed and accuracy under challenge.</p></TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                  </TooltipTrigger>
                    <TooltipContent><p>Shows your full range of mental strengths.</p></TooltipContent>
                </Tooltip>
              </TabsList>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <TabsContent value="overview">
              <ChcProfileOverview />
          </TabsContent>
          <TabsContent value="efficiency">
              <CognitiveEfficiency />
          </TabsContent>
          <TabsContent value="profile">
            <FullStrengthProfile />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
