
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Ear, Headphones } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrialRecord } from "@/types";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

const GAME_ID: GameId = 'glr_fluency_storm'; // This is a Glr task with Ga/Gwm/EF components
const policy = difficultyPolicies[GAME_ID];

const instrumentTimbres: Record<string, OscillatorType> = {
    drums: 'sine', // Placeholder, real drums are complex noise
    bass: 'triangle',
    piano: 'square',
    flute: 'sine',
    guitar: 'sawtooth',
};

type Trial = {
    reference_scene_timbres: OscillatorType[];
    comparison_scene_timbres: OscillatorType[];
    reference_scene_names: string[];
    correct_answer: string;
};

export function AuditorySceneSubtraction() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playSimultaneous, stopAll, resumeContext, isAudioReady, getAudioContextTime, getLatencyInfo } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'tutorial' | 'playing' | 'feedback' | 'finished'>('loading');
    const [trial, setTrial] = useState<Trial | null>(null);
    const [feedback, setFeedback] = useState('');
    const [tutorialStep, setTutorialStep] = useState(0);

    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const stimulusOnsetTs = useRef(0);
    const sessionId = useRef(crypto.randomUUID());
    const deviceInfo = useRef<any>(null);
    
    const startNewTrial = useCallback(() => {
        if (!isAudioReady) return;
        const isTutorial = gameState === 'tutorial';

        if (!isTutorial && trialCount.current >= policy.sessionLength) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const level = isTutorial ? 1 : state.currentLevel;
        const levelParams = policy.levelMap[level]?.content_config['music']?.params;
        if (!levelParams) return;

        const { layer_count, timbres } = levelParams;
        
        const reference_scene_names = timbres.slice(0, layer_count);
        const reference_scene_timbres = reference_scene_names.map((name: string) => instrumentTimbres[name] || 'sine');
        const missing_instrument_index = Math.floor(Math.random() * layer_count);
        const correct_answer = reference_scene_names[missing_instrument_index];
        const comparison_scene_timbres = reference_scene_timbres.filter((_, i) => i !== missing_instrument_index);

        setTrial({ reference_scene_timbres, comparison_scene_timbres, reference_scene_names, correct_answer });
        
        playSimultaneous(reference_scene_timbres, 3000);
        
        setTimeout(() => {
            stopAll();
            setTimeout(() => {
                const comparisonHandles = playSimultaneous(comparison_scene_timbres, 3000);
                if (comparisonHandles.length > 0) {
                     stimulusOnsetTs.current = comparisonHandles[0].scheduledOnset;
                }
            }, 500)
        }, 3000);
        
        if (isTutorial) setTutorialStep(s => s + 1);
        else trialCount.current++;
        setGameState('playing');
        setFeedback('');

    }, [getAdaptiveState, playSimultaneous, stopAll, isAudioReady, gameState]);

    const startNewSession = useCallback((isTutorial: boolean) => {
        resumeContext();
        const info = getLatencyInfo();
        deviceInfo.current = info;

        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        sessionId.current = crypto.randomUUID();
        setTutorialStep(0);
        
        if (isTutorial) {
            setGameState('tutorial');
            startNewTrial();
        } else {
            setGameState('playing');
            startNewTrial();
        }
    }, [resumeContext, getLatencyInfo, getAdaptiveState, updateAdaptiveState, startNewTrial]);

    useEffect(() => {
         if(gameState === 'tutorial' && tutorialStep >= 3) {
             stopAll();
             setTimeout(() => startNewSession(false), 1000); // Start scored session after tutorial
         }
    }, [gameState, tutorialStep, startNewSession, stopAll]);


    const handleResponse = (response: string) => {
        if (!trial) return;
        stopAll();
        const responseTs = getAudioContextTime();
        const reactionTimeMs = (responseTs - stimulusOnsetTs.current) * 1000;
        const isCorrect = response === trial.correct_answer;
        
        if (gameState === 'tutorial') {
             setFeedback(isCorrect ? 'Correct!' : `Incorrect. The missing instrument was ${trial.correct_answer}.`);
             setTimeout(startNewTrial, 2000);
             return;
        }
        
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs, 
            telemetry: {
                layer_count: trial.reference_scene_timbres.length,
                layers: trial.reference_scene_names,
                removed_layer: trial.correct_answer,
                timbre_similarity_level: state.currentLevel, // Placeholder
                player_choice: response,
            }
        };
        sessionTrials.current.push(trialResult);

        logTrial({
            sessionId: sessionId.current!,
            userId: 'local-user',
            gameId: GAME_ID,
            trialIndex: trialCount.current,
            difficultyLevel: state.currentLevel,
            condition: 'scene_subtraction',
            stimulusParams: {
                layers: trial.reference_scene_names,
                removed: trial.correct_answer,
            },
            stimulusOnsetTs: stimulusOnsetTs.current,
            responseTs,
            rtMs: reactionTimeMs,
            correct: isCorrect,
            responseType: isCorrect ? 'hit' : 'error',
            deviceInfo: deviceInfo.current,
            meta: trialResult.telemetry,
        } as any);

        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);

        setFeedback(isCorrect ? 'Correct!' : `Incorrect. The missing instrument was ${trial.correct_answer}.`);
        setGameState('feedback');
        setTimeout(startNewTrial, 2000);
    };
    
    useEffect(() => {
        if(isAudioReady && gameState === 'loading') {
            startNewSession(true);
        }
    }, [isAudioReady, gameState, startNewSession]);

    const renderContent = () => {
        if (gameState === 'loading' && !isAudioReady) {
            return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'finished') {
            return (
                <div className="text-center">
                    <CardTitle>Session Complete</CardTitle>
                    <Button onClick={() => startNewSession(true)} className="mt-4">Play Again</Button>
                </div>
            )
        }
        if (!trial) return <Loader2 className="animate-spin" />;

        return (
            <div className="flex flex-col items-center gap-8 w-full">
                 {gameState === 'tutorial' && <p className="font-bold mb-2">TUTORIAL ({tutorialStep}/3)</p>}
                 <div className="text-center">
                    <p className="font-bold text-2xl">Which instrument is missing from the second mix?</p>
                 </div>
                 <div className="h-10 text-xl font-bold">
                     {feedback && <p className={cn(feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>{feedback}</p>}
                 </div>
                 <div className="flex flex-wrap gap-4 justify-center">
                    {trial.reference_scene_names.map(instrument => (
                         <Button key={instrument} onClick={() => handleResponse(instrument)} size="lg" className="w-32 h-16" disabled={gameState === 'feedback'}>
                             {instrument.charAt(0).toUpperCase() + instrument.slice(1)}
                         </Button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-lg text-center bg-emerald-950 border-emerald-500/20 text-emerald-100">
            <CardHeader>
                <CardTitle className="text-emerald-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-emerald-500/10 rounded-md"><Ear className="w-6 h-6 text-emerald-400" /></span>
                    Auditory Scene Subtraction
                </CardTitle>
                <CardDescription className="text-emerald-300/70">Listen to the full mix, then identify which instrument is removed. Wired headphones recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
