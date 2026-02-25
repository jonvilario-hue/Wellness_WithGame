
'use client';

import { useState } from "react";
import { StrengthProfileRadar } from "./strength-profile-radar";
import { SubjectSelector } from "./subject-selector";
import { StrengthsWeaknesses } from "./strengths-weaknesses";
import { SubjectInsightCard } from "./subject-insight-card";
import { Card } from "../ui/card";
import { GrowthDecoration } from "../ui/growth-decoration";
import { useTheme } from "@/hooks/use-theme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TrainingFocus } from '@/types';
import { FocusProfileRadar } from './focus-profile-radar';

export type ViewMode = 'domain' | 'focus';

export function HolisticView() {
    const [viewMode, setViewMode] = useState<ViewMode>('domain');
    const { organicGrowth } = useTheme();

    return (
        <div className="space-y-6">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
                <div className="flex justify-center mb-4">
                    <TabsList>
                        <TabsTrigger value="domain">Cognitive Domain</TabsTrigger>
                        <TabsTrigger value="focus">By Training Focus</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="domain">
                    <div className="space-y-6">
                        <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                             {organicGrowth && <GrowthDecoration />}
                            <StrengthProfileRadar focus="neutral" />
                        </Card>
                        <StrengthsWeaknesses subject="neutral" viewMode="domain" />
                        <SubjectInsightCard subject="neutral" viewMode="domain" />
                    </div>
                </TabsContent>

                <TabsContent value="focus">
                     <div className="space-y-6">
                        <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                            {organicGrowth && <GrowthDecoration />}
                            <FocusProfileRadar />
                        </Card>
                        <StrengthsWeaknesses subject={'neutral'} viewMode="focus" />
                        <SubjectInsightCard subject={'neutral'} viewMode="focus" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
