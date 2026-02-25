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

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Sub-components for each mode ---

const PitchDiscriminationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['piano-c4', 'piano-f4', 'piano-g4'], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);

    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<'higher' | 'lower'>('higher');

    const handlePlay = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        const isHigher = Math.random() > 0.5;
        answerRef.current = isHigher ? 'higher' : 'lower';
        const comparisonAssetId = (isHigher ? 'piano-g4' : 'piano-f4') as AssetId;

        engine.playSample('piano-c4');
        setTimeout(() => engine.playSample(comparisonAssetId, { onEnd: () => setIsPlaying(false) }), 800);
    }, [engine, isPlaying]);

    const handleAnswer = (userChoice: 'higher' | 'lower') => {
        if (isPlaying) return;
        const isCorrect = userChoice === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="flex flex-col items-center gap-4 w-full text-violet-200">
            <p className="font-semibold text-lg">Was the second tone higher or lower?</p>
            <Button onClick={handlePlay} disabled={isPlaying}>Play Tones</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Button onClick={() => handleAnswer('lower')} disabled={isPlaying} size="lg" className="h-24 text-xl">Lower</Button>
                <Button onClick={() => handleAnswer('higher')} disabled={isPlaying} size="lg" className="h-24 text-xl">Higher</Button>
            </div>
        </div>
    );
};

const TimbreModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['instr-piano', 'instr-guitar', 'instr-bell'], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);
    const [currentInstrument, setCurrentInstrument] = useState<AssetId | null>(null);
    const [feedback, setFeedback] = useState('');

    const playRandomInstrument = useCallback(() => {
        if (!engine || isLoading) return;
        const instrument = assetsToLoad[Math.floor(Math.random() * assetsToLoad.length)];
        setCurrentInstrument(instrument);
        engine.playSample(instrument);
        setFeedback('');
    }, [engine, isLoading, assetsToLoad]);

    useEffect(() => {
        if (!isLoading) playRandomInstrument();
    }, [isLoading, playRandomInstrument]);

    const handleAnswer = (choice: AssetId) => {
        if (!currentInstrument) return;
        const isCorrect = choice === currentInstrument;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Which instrument did you hear?</p>
            <Button onClick={playRandomInstrument}>Play Sound</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                {assetsToLoad.map(assetId => (
                    <Button key={assetId} onClick={() => handleAnswer(assetId)} size="lg" className="h-20 capitalize">{assetId.replace('instr-', '')}</Button>
                ))}
            </div>
        </div>
    );
};

const LocalizationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['perc-click'], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);
    const [feedback, setFeedback] = useState('');
    const answerRef = useRef<'left' | 'center' | 'right'>('center');

    const playSpatialSound = useCallback(() => {
        if (!engine || isLoading) return;
        const pans = [-0.8, 0, 0.8];
        const panLabels: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
        const randomIndex = Math.floor(Math.random() * pans.length);
        
        answerRef.current = panLabels[randomIndex];
        engine.playSample('perc-click', { pan: pans[randomIndex] });
        setFeedback('');
    }, [engine, isLoading]);
    
    useEffect(() => {
        if (!isLoading) playSpatialSound();
    }, [isLoading, playSpatialSound]);

    const handleAnswer = (choice: 'left' | 'center' | 'right') => {
        const isCorrect = choice === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
         <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Where did the sound come from?</p>
            <Button onClick={playSpatialSound}>Play Sound</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <Button onClick={() => handleAnswer('left')} size="lg" className="h-20">Left</Button>
                <Button onClick={() => handleAnswer('center')} size="lg" className="h-20">Center</Button>
                <Button onClick={() => handleAnswer('right')} size="lg" className="h-20">Right</Button>
            </div>
        </div>
    )
};


const Menu = ({ onSelectMode }: { onSelectMode: (mode: GaMode) => void }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center w-full max-w-2xl">
    {(Object.keys(modeConfig) as GaMode[]).map(modeKey => {
      const { Icon, title } = modeConfig[modeKey];
      return (
        <Card key={modeKey} className="bg-violet-900 hover:bg-violet-800 transition-colors cursor-pointer" onClick={() => onSelectMode(modeKey)}>
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <Icon className="w-8 h-8 text-violet-400" />
            <p className="font-semibold text-violet-100">{title}</p>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

type GaMode = 'pitch' | 'timing' | 'timbre' | 'recall' | 'segregation' | 'localization' | 'prosody';

const modeConfig: Record<GaMode, { title: string, Icon: React.ElementType, Component: React.FC<{ onComplete: () => void }> }> = {
    pitch: { title: "Pitch", Icon: Waves, Component: PitchDiscriminationModule },
    timing: { title: "Timing", Icon: Music, Component: () => <p>Timing Module WIP</p> },
    timbre: { title: "Timbre", Icon: Ear, Component: TimbreModule },
    recall: { title: "Melody Recall", Icon: Brain, Component: () => <p>Melody Recall WIP</p> },
    segregation: { title: "Segregation", Icon: Bot, Component: () => <p>Segregation Module WIP</p> },
    localization: { title: "Localization", Icon: Locate, Component: LocalizationModule },
    prosody: { title: "Prosody", Icon: Headphones, Component: () => <p>Prosody Module WIP</p> },
};

// --- Main Lab Component ---
export default function AuditoryProcessingRouter() {
    const [activeMode, setActiveMode] = useState<'menu' | GaMode>('menu');
    const { engine } = useAudioEngine();

    const handleSelectMode = (mode: GaMode) => {
        engine?.resumeContext();
        setActiveMode(mode);
    };

    const handleModeComplete = () => {
        setActiveMode('menu');
    };

    const renderActiveMode = () => {
        if (activeMode === 'menu') {
            return <Menu onSelectMode={handleSelectMode} />;
        }
        const { Component } = modeConfig[activeMode];
        return <Component onComplete={handleModeComplete} />;
    };

    return (
        <Card className="w-full max-w-3xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <span className="p-2 bg-violet-500/10 rounded-md"><domainIcons.Ga className="w-6 h-6 text-violet-400" /></span>
                    Auditory Processing Lab
                </CardTitle>
                <CardDescription className="text-violet-300/70">A rotating lab of exercises to sharpen your brain's ability to analyze and distinguish sounds. Wired headphones recommended for best results.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[450px]">
                {renderActiveMode()}
            </CardContent>
        </Card>
    );
}