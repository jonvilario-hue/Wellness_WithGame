'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useAudioEngine, type ToneConfig } from "@/hooks/useAudioEngine";
import { Headphones, Music, Waves, Ear, Locate, Brain, Bot, Loader2, RefreshCw, AudioLines, Smile } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { PRNG } from '@/lib/rng';
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import type { TrainingFocus } from '@/types';
import EQMode from "./EQMode";
import MathMode from "./MathMode";


// ──────────────────────────────────────────────
// Procedural Modules (keep all existing ones as-is)
// ──────────────────────────────────────────────

const PitchDiscriminationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<'higher' | 'lower'>('higher');
    const prngRef = useRef(new PRNG('pitch-seed'));

    const playTrialAudio = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        const isHigher = prngRef.current.nextFloat() > 0.5;
        answerRef.current = isHigher ? 'higher' : 'lower';
        
        const baseFreq = 440; // A4
        const differenceInCents = 100; // 1 semitone
        const comparisonFreq = baseFreq * Math.pow(2, (isHigher ? differenceInCents : -differenceInCents) / 1200);

        engine.playTone({ frequency: baseFreq, duration: 0.4, type: 'sine' });
        setTimeout(() => {
            engine.playTone({ frequency: comparisonFreq, duration: 0.4, type: 'sine', onEnd: () => setIsPlaying(false) });
        }, 800);
    }, [engine, isPlaying]);

    const handleAnswer = (userChoice: 'higher' | 'lower') => {
        if (isPlaying) return;
        const isCorrect = userChoice === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    useEffect(() => {
        playTrialAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col items-center gap-4 w-full text-violet-200">
            <p className="font-semibold text-lg">Was the second tone higher or lower?</p>
            <Button onClick={playTrialAudio} disabled={isPlaying}><RefreshCw className="mr-2 h-4 w-4"/> Replay</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Button onClick={() => handleAnswer('lower')} disabled={isPlaying} className="h-24 text-xl">Lower</Button>
                <Button onClick={() => handleAnswer('higher')} disabled={isPlaying} className="h-24 text-xl">Higher</Button>
            </div>
        </div>
    );
};

const SpectralDiscriminationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [isPlaying, setIsPlaying] = useState(false);
    const [feedback, setFeedback] = useState('');
    const answerRef = useRef<'same' | 'different' | null>(null);
    const prngRef = useRef(new PRNG('spectral-seed'));

    const playComplexTones = useCallback(() => {
        if (!engine?.audioContext || isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        const isSame = prngRef.current.nextFloat() > 0.5;
        answerRef.current = isSame ? 'same' : 'different';

        const fundamental = 220; // A3
        const harmonics = [1, 2, 3, 4, 5, 6];
        
        const playToneSet = (partials: number[], onEnd?: () => void) => {
            const partialConfigs = partials.map(h => ({
                frequency: fundamental * h,
                volume: 0.2 / h,
                type: 'sine' as OscillatorType,
            }));
           const handles = engine.playComplexTone(partialConfigs, 1.0);
           if (onEnd && handles && handles.length > 0) {
               handles[0].sourceNode.addEventListener('ended', onEnd, { once: true });
           } else if (onEnd) {
               setTimeout(onEnd, 1000);
           }
        };
        
        playToneSet(harmonics); // Play full tone
        
        setTimeout(() => {
            if (isSame) {
                playToneSet(harmonics, () => setIsPlaying(false));
            } else {
                const removedHarmonic = harmonics[prngRef.current.nextIntRange(1, harmonics.length)];
                playToneSet(harmonics.filter(h => h !== removedHarmonic), () => setIsPlaying(false));
            }
        }, 1500);

    }, [engine, isPlaying]);
    
    useEffect(() => { 
        playComplexTones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const handleAnswer = (choice: 'same' | 'different') => {
        if (isPlaying) return;
        if(choice === answerRef.current) setFeedback('Correct!')
        else setFeedback('Incorrect.');
        setTimeout(onComplete, 1500);
    };

    return (
         <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Are the two complex tones the same or different?</p>
            <Button onClick={playComplexTones} disabled={isPlaying}><RefreshCw className="mr-2 h-4 w-4"/> Replay</Button>
             <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-2 gap-4  w-full max-w-sm">
                <Button onClick={() => handleAnswer('same')} disabled={isPlaying} className="h-24 text-xl">Same</Button>
                <Button onClick={() => handleAnswer('different')} disabled={isPlaying} className="h-24 text-xl">Different</Button>
            </div>
        </div>
    )
};

const EnhancedLocalizationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<number>(0);
    const positions = useMemo(() => [-0.9, -0.45, 0, 0.45, 0.9], []);
    const prngRef = useRef(new PRNG('localization-seed'));

    const playSpatialSound = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        const randomIndex = prngRef.current.nextIntRange(0, positions.length);
        answerRef.current = randomIndex;
        engine.playTone({
            frequency: 880,
            duration: 0.15,
            type: 'sine',
            pan: positions[randomIndex],
            volume: 0.6,
            onEnd: () => setIsPlaying(false)
        });
        setFeedback('');
    }, [engine, isPlaying, positions]);

    useEffect(() => {
        playSpatialSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnswer = (choiceIndex: number) => {
        if (isPlaying) return;
        const isCorrect = choiceIndex === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    return (
         <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Where did the sound come from?</p>
            <Button onClick={playSpatialSound} disabled={isPlaying}><RefreshCw className="mr-2 h-4 w-4"/> Replay</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
                {positions.map((_, index) => (
                    <Button key={index} onClick={() => handleAnswer(index)} disabled={isPlaying} className="h-16 text-lg">{index + 1}</Button>
                ))}
            </div>
        </div>
    )
};


const PatternSequencingModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<number>(0);
    const prngRef = useRef(new PRNG('pattern-seed'));

    const playPattern = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        // Play an ascending/descending pattern, ask what comes next
        const baseFreq = 300;
        const stepUp = prngRef.current.nextFloat() > 0.5;
        answerRef.current = stepUp ? 1 : 0;

        const freqs = stepUp
            ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5] // ascending
            : [baseFreq * 1.5, baseFreq * 1.25, baseFreq]; // descending

        freqs.forEach((freq, i) => {
            setTimeout(() => {
                engine.playTone({
                    frequency: freq,
                    duration: 0.3,
                    type: 'triangle',
                    onEnd: i === freqs.length - 1 ? () => setIsPlaying(false) : undefined,
                });
            }, i * 500);
        });
    }, [engine, isPlaying]);

    useEffect(() => {
        playPattern();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnswer = (choice: number) => {
        if (isPlaying) return;
        const isCorrect = choice === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">What comes next in the pattern?</p>
            <Button onClick={playPattern} disabled={isPlaying}>
                <RefreshCw className="mr-2 h-4 w-4" /> Replay
            </Button>
            <div className="h-8 text-xl font-bold">
                {feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Button onClick={() => handleAnswer(1)} disabled={isPlaying} className="h-24 text-xl">Higher</Button>
                <Button onClick={() => handleAnswer(0)} disabled={isPlaying} className="h-24 text-xl">Lower</Button>
            </div>
        </div>
    );
};


// ──────────────────────────────────────────────
// THE KEY FIX: Map each tab directly to one game
// ──────────────────────────────────────────────

const FOCUS_TO_GAME: Record<TrainingFocus, {
    title: string;
    Icon: React.ElementType;
    Component: React.FC<{ onComplete: () => void }>;
}> = {
    neutral: { title: "Pitch Discrimination", Icon: Waves, Component: PitchDiscriminationModule },
    math:    { title: "Rhythm Patterns",      Icon: Music, Component: MathMode },
    music:   { title: "Timbre Analysis",      Icon: Ear,   Component: SpectralDiscriminationModule },
    verbal:  { title: "Speech Processing",    Icon: Bot,   Component: () => <p>Speech Module WIP</p> },
    spatial: { title: "Sound Localization",   Icon: Locate, Component: EnhancedLocalizationModule },
    eq:      { title: "Intonation Detective",      Icon: Smile, Component: EQMode },
    logic:   { title: "Pattern Sequencing",   Icon: AudioLines, Component: PatternSequencingModule },
};


// ──────────────────────────────────────────────
// Router — no more menu, just render the right game
// ──────────────────────────────────────────────

export default function AuditoryProcessingRouter() {
    const { engine, isReady, initializeAudio } = useAudioEngine();
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const effectiveFocus = isComponentLoaded ? (override || globalFocus) : 'neutral';

    // Get the game for the current tab
    const currentGame = FOCUS_TO_GAME[effectiveFocus] || FOCUS_TO_GAME.neutral;

    useEffect(() => {
        return () => { engine?.stopAll(); };
    }, [effectiveFocus, engine]);

    if (!isReady) {
        return (
            <Card className="w-full max-w-3xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
                <CardContent className="flex flex-col items-center justify-center gap-4 min-h-[450px]">
                    <h2 className="text-2xl font-bold">Enable Audio</h2>
                    <p className="text-muted-foreground text-center">Click the button below to start the audio engine.</p>
                    <Button onClick={initializeAudio} size="lg"><Headphones className="mr-2" /> Enable Audio</Button>
                </CardContent>
            </Card>
        );
    }

    if (!isComponentLoaded) {
        return (
             <Card className="w-full max-w-3xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
                <CardContent className="flex flex-col items-center justify-center gap-4 min-h-[450px]">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-3xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <span className="p-2 bg-violet-500/10 rounded-md">
                        <currentGame.Icon className="w-6 h-6 text-violet-400" />
                    </span>
                    {currentGame.title}
                </CardTitle>
                <CardDescription className="text-violet-300/70">
                    Wired headphones recommended for best results.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[450px]">
                <currentGame.Component onComplete={() => { 
                    // This logic can be expanded to automatically move to the next game in a sequence
                    // For now, it does nothing, and the user can switch tabs manually.
                 }} />
            </CardContent>
        </Card>
    );
}
