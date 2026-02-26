'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { Loader2 } from "lucide-react";
import type { TrainingFocus, GameId, TrialResult } from "@/types";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { useGlrStore, type GlrGameMode } from "@/hooks/use-glr-store";
import { domainIcons } from "@/components/icons";
import { FOCUS_MODE_META } from "@/lib/mode-constants";

// Import the newly created components
import { AssociativeChainMode } from './AssociativeChainMode';
import { CategorySwitchingMode } from './CategorySwitchingMode';
import { SpacedRetrievalMode } from "./spaced-retrieval-mode";
import { OperatorRecallMode } from "./OperatorRecallMode";
import { GlrMemoryPalace } from "./GlrMemoryPalace";

const GLR_GAME_ID: GameId = 'glr_fluency_storm';

export function SemanticFluencyStorm() {
    const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
    const [currentMode, setCurrentMode] = useState<GlrGameMode | null>(null);
    const [lastScore, setLastScore] = useState(0);
    const [lastClusterBreadth, setLastClusterBreadth] = useState(0);
    const { getNextMode } = useGlrStore();
    const { getAdaptiveState, updateAdaptiveState, endSession } = usePerformanceStore();

    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentTrainingFocus = isComponentLoaded ? (override || globalFocus) : 'neutral';

    const handleStart = () => {
        const mode = getNextMode(currentTrainingFocus);
        setCurrentMode(mode);
        setGameState('running');
    };

    const handleGameComplete = (result: { score: number, trials: TrialResult[], cluster_breadth?: number }) => {
        const { score, trials, cluster_breadth } = result;
        setLastScore(score);
        setLastClusterBreadth(cluster_breadth || 0);
        
        const adaptiveState = getAdaptiveState(GLR_GAME_ID, currentTrainingFocus);
        if (trials.length > 0) {
            const finalState = endSession(adaptiveState, trials);
            updateAdaptiveState(GLR_GAME_ID, currentTrainingFocus, finalState);
        }
        
        setGameState('finished');
    };

    const renderContent = () => {
        if (gameState === 'idle') {
            const { Icon, label } = FOCUS_MODE_META[currentTrainingFocus];
            return (
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex flex-col items-center gap-2 text-emerald-300">
                        <Icon className="w-10 h-10" />
                        <span className="font-semibold">{label} Mode</span>
                    </div>
                    <p className="text-muted-foreground">This game trains your ability to store and retrieve information efficiently. It rotates through different modes each time you play.</p>
                    <Button onClick={handleStart} size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">Retrieval Trainer</Button>
                </div>
            );
        }
        if (gameState === 'finished') {
             return (
                <div className="text-center space-y-4">
                    <CardTitle>Session Complete!</CardTitle>
                    <p className="text-xl">Words Found: <span className="font-bold text-primary">{lastScore}</span></p>
                    {lastClusterBreadth > 0 && (
                        <p className="text-lg">Emotion Clusters Explored: <span className="font-bold text-primary">{lastClusterBreadth}</span></p>
                    )}
                    <Button onClick={handleStart} size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">Play Next Mode</Button>
                </div>
            );
        }
        if (gameState === 'running') {
            switch (currentMode) {
                case 'associative':
                    return <AssociativeChainMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                case 'spaced':
                    return <SpacedRetrievalMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                 case 'operator_recall':
                    return <OperatorRecallMode onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                case 'category':
                    return <CategorySwitchingMode onComplete={handleGameComplete} focus={currentTrainingFocus} />;
                case 'spatial':
                    return <GlrMemoryPalace onComplete={handleGameComplete as any} focus={currentTrainingFocus} />;
                default:
                    return <Loader2 className="animate-spin" />;
            }
        }
    };

    return (
        <Card className="w-full max-w-2xl bg-emerald-950 border-emerald-500/20 text-emerald-100 min-h-[500px]">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-emerald-300">
                    <span className="p-2 bg-emerald-500/10 rounded-md"><domainIcons.Glr className="w-6 h-6 text-emerald-400" /></span>
                    Retrieval Trainer
                </CardTitle>
                <CardDescription className="text-emerald-300/70">Strengthen your brain's ability to find and use stored information. Some modes use audio; wired headphones are recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
