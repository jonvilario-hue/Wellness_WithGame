
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { TIER_CONFIG } from '@/lib/adaptive-engine';
import type { Tier } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chcDomains } from '@/types';
import { Label } from '../ui/label';

const tierExamples: Record<Tier, string> = {
    0: "Focuses on core mechanics with no distractors.",
    1: "Introduces mild interference and distractions.",
    2: "Adds complex rule-switching and dual features.",
    3: "Pushes limits with uncertainty and tight timing."
}

export function TrainingSettings() {
    const { globalTier, setGlobalTier, gameStates, setGameTier } = usePerformanceStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Training Calibration</CardTitle>
                <CardDescription>
                    This sets your starting range. The app adapts to your performance in real-time during every session.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                  <Label className="text-base font-semibold">Global Intensity</Label>
                  <p className="text-sm text-muted-foreground mb-4">Select your baseline intensity. This will be the default for all games.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(TIER_CONFIG) as unknown as Tier[]).map(tierKey => {
                        const tier = TIER_CONFIG[tierKey];
                        const isActive = globalTier === tierKey;
                        return (
                            <div 
                                key={tier.name}
                                onClick={() => setGlobalTier(tierKey)}
                                className={cn(
                                    "rounded-lg border-2 p-4 cursor-pointer transition-all relative flex flex-col",
                                    isActive ? "border-primary shadow-md" : "border-muted hover:border-muted-foreground/50"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-2 right-2 p-1 rounded-full bg-primary text-primary-foreground">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                                <h3 className="font-bold text-lg">{tier.name}</h3>
                                <p className="text-sm text-muted-foreground flex-grow">{tierExamples[tierKey]}</p>
                                <p className="text-xs font-mono text-right mt-2">Levels {tier.range[0]}-{tier.range[1]}</p>
                            </div>
                        )
                    })}
                  </div>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      Per-Game Intensity Overrides
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                            You can set a different intensity for specific games if you feel the global setting isn't right for them.
                        </p>
                        <div className="space-y-3">
                        {chcDomains.map(domain => {
                            const gameTier = gameStates[domain.id]?.neutral?.tier ?? globalTier;
                            return (
                                <div key={domain.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <Label htmlFor={`select-${domain.id}`} className="font-medium">{domain.name}</Label>
                                    <Select 
                                        value={gameTier.toString()} 
                                        onValueChange={(value) => setGameTier(domain.id, parseInt(value, 10) as Tier)}
                                    >
                                        <SelectTrigger id={`select-${domain.id}`} className="w-[180px]">
                                            <SelectValue placeholder="Select intensity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {(Object.keys(TIER_CONFIG) as unknown as Tier[]).map(tierKey => (
                                                <SelectItem key={tierKey} value={tierKey.toString()}>
                                                    {TIER_CONFIG[tierKey].name}
                                                </SelectItem>
                                             ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )
                        })}
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

            </CardContent>
        </Card>
    );
}
