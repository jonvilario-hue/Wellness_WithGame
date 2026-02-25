
'use client';

import { useState } from "react";
import { StrengthProfileRadar } from "./strength-profile-radar";
import { SubjectSelector } from "./subject-selector";
import { StrengthsWeaknesses } from "./strengths-weaknesses";
import { SubjectInsightCard } from "./subject-insight-card";
import { Card } from "../ui/card";
import { GrowthDecoration } from "../ui/growth-decoration";
import { useTheme } from "@/hooks/use-theme";

export type Subject = 'all' | 'eq';

export function HolisticView() {
    const [subject, setSubject] = useState<Subject>('all');
    const { organicGrowth } = useTheme();

    return (
        <div className="space-y-6">
            <SubjectSelector selectedSubject={subject} onSelectSubject={setSubject} />
            <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                 {organicGrowth && <GrowthDecoration />}
                <StrengthProfileRadar subject={subject} />
            </Card>
            <StrengthsWeaknesses subject={subject}/>
            <SubjectInsightCard subject={subject}/>
        </div>
    );
}
