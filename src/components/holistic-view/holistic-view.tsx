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
    const [selectedFocus, setSelectedFocus] = useState<TrainingFocus>('neutral');
    const [viewMode, setViewMode] = useState<ViewMode>('domain');
    const { organicGrowth } = useTheme();

    return (
        <div className="space-y-6">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
                <div className="flex justify-center mb-4">
                    <TabsList>
                        <TabsTrigger value="focus">By Training Focus</TabsTrigger>
                        <TabsTrigger value="domain">Cognitive Domain</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="domain">
                    <div className="space-y-6">
                        <SubjectSelector selectedSubject={selectedFocus} onSelectSubject={setSelectedFocus} />
                        <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                             {organicGrowth && <GrowthDecoration />}
                            <StrengthProfileRadar focus={selectedFocus} />
                        </Card>
                        <StrengthsWeaknesses subject={selectedFocus} viewMode="domain" />
                        <SubjectInsightCard subject={selectedFocus} viewMode="domain" />
                    </div>
                </TabsContent>

                <TabsContent value="focus">
                     <div className="space-y-6">
                        <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                            {organicGrowth && <GrowthDecoration />}
                            <FocusProfileRadar />
                        </Card>
                        <StrengthsWeaknesses subject={selectedFocus} viewMode="focus" />
                        <SubjectInsightCard subject={selectedFocus} viewMode="focus" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
