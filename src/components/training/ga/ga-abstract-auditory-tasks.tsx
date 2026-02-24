
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { Headphones, Volume2, Loader2, Ear, Check, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { AdaptiveState, TrainingFocus } from "@/types";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Web Audio API Hook ---
const useAudioEngine = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const primaryGainRef = useRef<GainNode | null>(null);

    const getAudioContext = useCallback(() => {
        if (typeof window !== 'undefined' && !audioContextRef.current) {
            try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = context;
                const gainNode = context.createGain();
                gainNode.connect(context.destination);
                primaryGainRef.current = gainNode;
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
        return audioContextRef.current;
    }, []);

    const resumeContext = useCallback(async () => {
        const context = getAudioContext();
        if (context && context.state === 'suspended') {
            await context.resume().catch(e => console.error("Could not resume audio context", e));
        }
    }, [getAudioContext]);
    
    const setVolume = useCallback((volume: number) => {
        const context = getAudioContext();
        if (primaryGainRef.current && context) {
            primaryGainRef.current.gain.setValueAtTime(volume, context.currentTime);
        }
    }, [getAudioContext]);

    const playTone = useCallback(({ freq, duration, startTime, type = 'sine'}: { freq: number, duration: number, startTime: number, type?: OscillatorType}) => {
        const context = getAudioContext();
        if (!context || !primaryGainRef.current) return;

        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.connect(gain);
        gain.connect(primaryGainRef.current);

        const rampTime = 0.01; // 10ms ramp to prevent clicks
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + rampTime);
        gain.gain.setValueAtTime(1, startTime + duration - rampTime);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }, [getAudioContext]);
    
    useEffect(() => {
        const context = getAudioContext();
        return () => {
            if (context && context.state !== 'closed') {
                context.close().catch(e => console.error("Could not close audio context", e));
            }
        };
    }, [getAudioContext]);

    return { resumeContext, setVolume, playTone };
};

// --- Pitch Discrimination Game Module ---
const PitchDiscriminationModule = ({ focus }: { focus: TrainingFocus }) => {
    const { playTone, resumeContext } = useAudioEngine();
    const [difficulty, setDifficulty] = useState(50); // Starting freq gap in Hz
    const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [score, setScore] = useState(0);
    const [trialCount, setTrialCount] = useState(0);
    const correctStreak = useRef(0);
    const answerRef = useRef<'higher' | 'lower'>('higher');
    const audioContext = (typeof window !== 'undefined') ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;


    const startNewTrial = useCallback(() => {
        if (!audioContext) return;
        resumeContext();
        setGameState('playing');
        setFeedback(null);
        
        const baseFreq = 440; // A4
        const isHigher = Math.random() > 0.5;
        answerRef.current = isHigher ? 'higher' : 'lower';

        const secondFreq = isHigher ? baseFreq + difficulty : baseFreq - difficulty;

        const now = audioContext.currentTime;
        playTone({ freq: baseFreq, duration: 0.3, startTime: now });
        playTone({ freq: secondFreq, duration: 0.3, startTime: now + 0.5 });
    }, [difficulty, playTone, resumeContext, audioContext]);

    useEffect(() => {
        startNewTrial();
    }, [startNewTrial]);
    
    const handleAnswer = (userChoice: 'higher' | 'lower') => {
        if (gameState !== 'playing') return;
        
        setGameState('feedback');
        setTrialCount(c => c + 1);
        const isCorrect = userChoice === answerRef.current;

        if (isCorrect) {
            setScore(s => s + 1);
            setFeedback('correct');
            correctStreak.current++;
            if (correctStreak.current >= 2) {
                setDifficulty(d => Math.max(5, d * 0.8)); // Decrease gap
                correctStreak.current = 0;
            }
        } else {
            setFeedback('incorrect');
            correctStreak.current = 0;
            setDifficulty(d => Math.min(100, d * 1.25)); // Increase gap
        }

        setTimeout(startNewTrial, 1500);
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full text-violet-200">
            <div className="w-full h-24 bg-violet-900/50 rounded-lg flex items-center justify-center p-4">
                {/* Oscilloscope Visual Motif */}
                <svg width="100%" height="100%" viewBox="0 0 200 50" preserveAspectRatio="none">
                    <path d="M 0 25 C 20 10, 40 40, 60 25 S 100 40, 120 25 S 160 10, 180 25, 200 25" stroke="hsl(var(--primary))" fill="none" strokeWidth="1.5"/>
                </svg>
            </div>
            
            <div className="h-8">
                {feedback && (
                    <div className={cn("text-2xl font-bold flex items-center gap-2", feedback === 'correct' ? 'text-green-400' : 'text-red-400')}>
                        {feedback === 'correct' ? <Check /> : <X />}
                        {feedback === 'correct' ? "Correct!" : "Incorrect"}
                    </div>
                )}
            </div>

            <p className="font-semibold text-lg">Was the second tone higher or lower?</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Button onClick={() => handleAnswer('lower')} disabled={gameState === 'feedback'} size="lg" className="h-24 text-xl bg-violet-600 hover:bg-violet-500">Lower</Button>
                <Button onClick={() => handleAnswer('higher')} disabled={gameState === 'feedback'} size="lg" className="h-24 text-xl bg-fuchsia-600 hover:bg-fuchsia-500">Higher</Button>
            </div>
            <div className="font-mono text-sm text-violet-400">Score: {score} / {trialCount} | Freq Gap: {difficulty.toFixed(1)} Hz</div>
        </div>
    )
};


// --- Main Router for Abstract Auditory Tasks ---
export function GaAbstractAuditoryTasks({ focus }: { focus: TrainingFocus }) {
    const { setVolume, resumeContext } = useAudioEngine();
    const [gameState, setGameState] = useState<'idle' | 'calibration' | 'running' >('idle');
    const [volume, setLocalVolume] = useState(0.5);

    const startSessionFlow = () => {
        resumeContext();
        setGameState('calibration');
    };

    const startTraining = () => {
        setVolume(volume);
        setGameState('running');
    };

    const renderContent = () => {
        switch (gameState) {
            case 'idle':
                return <Button onClick={startSessionFlow} size="lg" className="bg-violet-600 hover:bg-violet-500"><Headphones className="mr-2"/> Start Auditory Lab</Button>;
            case 'calibration':
                return (
                    <div className="w-full max-w-sm text-center space-y-4 text-violet-200 animate-in fade-in">
                        <CardTitle>Volume Calibration</CardTitle>
                        <p>Adjust to a comfortable level.</p>
                        <div className="flex items-center gap-4">
                            <Volume2 />
                            <Slider value={[volume * 100]} onValueChange={([v]) => setLocalVolume(v/100)} />
                        </div>
                        <Button onClick={startTraining} className="bg-violet-600 hover:bg-violet-500">Start Training</Button>
                    </div>
                );
            case 'running':
                // In a full implementation, this would rotate between different abstract tasks.
                // For now, it directly renders the Pitch Discrimination module.
                return <PitchDiscriminationModule focus={focus} />;
        }
    };

    return (
        <Card className="w-full max-w-2xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <Ear />
                    (Ga) Abstract Auditory Discrimination
                </CardTitle>
                <CardDescription className="text-violet-300/70">
                    Sharpen your brain's ability to distinguish pure, non-linguistic sounds.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[500px]">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
