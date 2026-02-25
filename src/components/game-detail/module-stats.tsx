
'use client';

import type { CHCDomain } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BrainCircuit, BookOpenText, MemoryStick, Zap, View, Ear, Archive, Goal } from 'lucide-react';


const Placeholder = ({ text }: { text: string }) => (
    <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">{text}</div>
)

export function ModuleStats({ domain }: { domain: CHCDomain }) {
    
  const renderStats = () => {
    switch(domain) {
        case 'Gf': return <Placeholder text="Rule Types Mastered | Grid Complexity" />;
        case 'Gc': return <Placeholder text="Vocabulary Tier | Question Categories" />;
        case 'Gwm': return <Placeholder text="Max Span Reached | Transformation Accuracy" />;
        case 'Gs': return <Placeholder text="Avg. Reaction Time | Accuracy Under Pressure" />;
        case 'Gv': return <Placeholder text="Rotation Accuracy | Assembly Speed" />;
        case 'Ga': return <Placeholder text="Pitch Threshold | Rhythm Accuracy" />;
        case 'Glr': return <Placeholder text="Recall Speed | Category Fluency" />;
        case 'EF': return <Placeholder text="Switch Cost (ms) | Inhibition Error Rate" />;
        default: return null;
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Module-Specific Statistics</CardTitle>
        </CardHeader>
        <CardContent>
            {renderStats()}
        </CardContent>
    </Card>
  )
}
