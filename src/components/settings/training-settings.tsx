
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { TIER_CONFIG } from '@/lib/adaptive-engine';
import type { Tier, TierSelection, TrainingFocus } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Sliders, Filter, BarChart, Settings, Music, TestTube, Clapperboard, Bot } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chcDomains } from '@/lib/domain-constants';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { useTrainingFocus } from '@/hooks/use-training-focus';

const tierExamples: Record<Tier, string> = {
    0: "Focuses on core mechanics with no distractors.",
    1: "Introduces mild interference and distractions.",
    2: "Adds complex rule-switching and dual features.",
    3: "Pushes limits with uncertainty and tight timing."
}

export function TrainingSettings() {
    const { globalTier, setGlobalTier, getAdaptiveState, setGameTier } = usePerformanceStore();
    const { focus } = useTrainingFocus();

    const allTiers: { key: TierSelection, name: string, icon: React.ElementType, description: string }[] = [
        { key: 4, name: "Automatic", icon: Bot, description: "Dynamically adjusts intensity based on your average performance."},
        ...Object.keys(TIER_CONFIG).map(tierKeyStr => {
            const tierKey = parseInt(tierKeyStr, 10) as Tier;
            return {
                key: tierKey,
                name: TIER_CONFIG[tierKey].name,
                icon: Check, // Placeholder, can be customized
                description: tierExamples[tierKey],
            }
        })
    ];


    return (
        <Card>
            <CardHeader>
                <CardTitle>Training Calibration</CardTitle>
                <CardDescription>
                    Customize your training experience. The app adapts in real-time, but these settings control the boundaries and content.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <div>
                  <Label className="text-base font-semibold flex items-center gap-2"><BarChart className="w-5 h-5"/> Global Intensity</Label>
                  <p className="text-sm text-muted-foreground mb-4">Select your baseline intensity. We recommend 'Automatic' for most users.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allTiers.map(tierInfo => {
                        const isActive = globalTier === tierInfo.key;
                        return (
                            <div 
                                key={tierInfo.key}
                                onClick={() => setGlobalTier(tierInfo.key)}
                                className={cn(
                                    "rounded-lg border-2 p-4 cursor-pointer transition-all relative flex flex-col",
                                    isActive ? "border-primary shadow-md" : "border-muted hover:border-muted-foreground/50",
                                    tierInfo.key === 4 && "bg-primary/5"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-2 right-2 p-1 rounded-full bg-primary text-primary-foreground">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                                <h3 className="font-bold text-lg flex items-center gap-2"><tierInfo.icon className="w-5 h-5"/>{tierInfo.name}</h3>
                                <p className="text-sm text-muted-foreground flex-grow">{tierInfo.description}</p>
                                {tierInfo.key !== 4 && (
                                  <p className="text-xs font-mono text-right mt-2">Levels {TIER_CONFIG[tierInfo.key as Tier].range[0]}-{TIER_CONFIG[tierInfo.key as Tier].range[1]}</p>
                                )}
                            </div>
                        )
                    })}
                  </div>
                </div>

                <Separator/>

                <div>
                    <Label className="text-base font-semibold flex items-center gap-2"><Sliders className="w-5 h-5"/> Advanced Controls</Label>
                     <p className="text-sm text-muted-foreground mb-4">Fine-tune your sessions for accessibility or specific goals.</p>
                     <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="pacing-slider" className="font-medium">
                                Pacing Adjustment
                                <p className="text-xs text-muted-foreground font-normal">Slow down or speed up game timers globally.</p>
                            </Label>
                            <span className="text-sm font-bold text-primary">100%</span>
                        </div>
                        <Slider defaultValue={[100]} max={150} min={50} step={10} id="pacing-slider" disabled/>
                        
                        <div className="flex items-center justify-between">
                            <Label htmlFor="ceiling-switch" className="font-medium">
                                Enable Difficulty Ceiling
                                <p className="text-xs text-muted-foreground font-normal">Prevent games from getting harder than your current tier's max.</p>
                            </Label>
                            <Switch id="ceiling-switch" disabled />
                        </div>
                     </div>
                </div>

                <Separator/>

                <Accordion type="multiple">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-base font-semibold"><Settings className="w-5 h-5 mr-2"/> Per-Game Intensity Overrides</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Set a different intensity for specific games if the global setting isn't right. Overrides 'Automatic' mode for that game. This applies to the currently active Focus Mode.
                        </p>
                        <div className="space-y-3">
                        {chcDomains.map(domain => {
                            const gameTier = getAdaptiveState(domain.id, focus)?.tier ?? globalTier;
                            return (
                                <div key={domain.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <Label htmlFor={`select-${domain.id}`} className="font-medium">{domain.name}</Label>
                                    <Select 
                                        value={gameTier.toString()} 
                                        onValueChange={(value) => setGameTier(domain.id, focus, parseInt(value, 10) as Tier)}
                                    >
                                        <SelectTrigger id={`select-${domain.id}`} className="w-[180px]">
                                            <SelectValue placeholder="Select intensity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {(Object.keys(TIER_CONFIG) as unknown as Tier[]).map(tierKeyStr => {
                                                const tierKey = parseInt(tierKeyStr, 10) as Tier;
                                                return (
                                                    <SelectItem key={tierKey} value={tierKey.toString()}>
                                                        {TIER_CONFIG[tierKey].name}
                                                    </SelectItem>
                                                )
                                             })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )
                        })}
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-2">
                    <AccordionTrigger className="text-base font-semibold"><Filter className="w-5 h-5 mr-2"/> Math Content Filters</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                           Disable certain types of math content if you want to focus your training. (Coming Soon)
                        </p>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="fractions-switch" className="font-medium text-muted-foreground/70">Enable Fractions & Decimals</Label>
                                <Switch id="fractions-switch" defaultChecked disabled />
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="negatives-switch" className="font-medium text-muted-foreground/70">Enable Negative Numbers</Label>
                                <Switch id="negatives-switch" defaultChecked disabled />
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="probability-switch" className="font-medium text-muted-foreground/70">Enable Probability & Statistics</Label>
                                <Switch id="probability-switch" defaultChecked disabled />
                           </div>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-3">
                    <AccordionTrigger className="text-base font-semibold"><Music className="w-5 h-5 mr-2"/> Music Content Filters</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                           Customize your music training experience. (Coming Soon)
                        </p>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="chords-switch" className="font-medium text-muted-foreground/70">Enable Harmony & Chords</Label>
                                <Switch id="chords-switch" defaultChecked disabled />
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="syncopation-switch" className="font-medium text-muted-foreground/70">Enable Complex Rhythms</Label>
                                <Switch id="syncopation-switch" defaultChecked disabled />
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="notation-switch" className="font-medium text-muted-foreground/70">Enable Visual Notation</Label>
                                <Switch id="notation-switch" defaultChecked disabled />
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <Label htmlFor="latency-slider" className="font-medium text-muted-foreground/70">Audio Latency Calibration</Label>
                                <span className="text-sm font-bold text-primary">Auto</span>
                           </div>
                           <Slider defaultValue={[0]} max={200} min={0} step={10} id="latency-slider" disabled/>
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

            </CardContent>
        </Card>
    );
}
