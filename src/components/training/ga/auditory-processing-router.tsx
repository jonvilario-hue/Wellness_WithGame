'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { Headphones, Loader2, Check, X, Music, Waves, Ear, Locate, Brain, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus, AssetId } from "@/types";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { PRNG } from "@/lib/rng";
import { domainIcons } from "@/components/icons";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import { GameStub } from "../game-stub";
import CoreMode from './CoreMode';
import { AuditoryFlanker } from './auditory-flanker';
import { CodeLogicMode } from './CodeLogicMode';
import VerbalMode from './VerbalMode';
import SpatialMode from './SpatialMode';
import MathMode from './MathMode';
import { AuditoryDebugger } from '../logic/auditory-debugger';
import { PhonemeDiscriminationModule } from './phoneme-discrimination';
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";


export function AuditoryProcessingRouter() {
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    if (!isGlobalFocusLoaded || !isOverrideLoaded) {
        return <div className="w-full max-w-3xl min-h-[450px] flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    const effectiveFocus = override || globalFocus;
    
    switch(effectiveFocus) {
        case 'neutral':
            return <CoreMode />;
        case 'music':
            return <AuditoryFlanker />;
        case 'spatial':
            return <SpatialMode />;
        case 'logic':
            return <CodeLogicMode />;
        case 'verbal':
            return <VerbalMode onComplete={() => {}} />;
        case 'math':
            return <MathMode onComplete={() => {}} />;
        default:
            return <GameStub name="Auditory Processing" description={`This mode (${effectiveFocus}) is not yet implemented for the Auditory Processing domain.`} chcFactor="Auditory Processing (Ga)" techStack={[]} complexity="Medium" fallbackPlan="N/A" />;
    }
}
