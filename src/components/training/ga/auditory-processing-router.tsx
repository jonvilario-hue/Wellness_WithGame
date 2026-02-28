
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
// Procedural Modules
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

    useEffect(() => {
        const timer = setTimeout(playTrialAudio, 500); // Add small delay
        return () => clearTimeout(timer);
    }, [playTrialAudio]);

    const handleAnswer = (userChoice: 'higher' | 'lower') => {
        if (isPlaying) return;
        const isCorrect = userChoice === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

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
           const handles = engine.playComplexTone(partials, 1.0);
           if (onEnd && handles && handles.length > 0) {
               // Use the first oscillator's onended event as a proxy for the group
               handles[0].sourceNode.addEventListener('ended', onEnd, { once: true });
           } else if (onEnd) {
               // Fallback timer if handle is null
               setTimeout(onEnd, 1000);
           }
        };
        
        playToneSet(harmonics); // Play full tone
        
        setTimeout(() => {
            if (isSame) {
                playToneSet(harmonics, () => setIsPlaying(false));
            } else {
                // Ensure a more prominent harmonic is removed to make the difference perceptible.
                const removableHarmonics = [2, 3, 4]; // Remove 2nd, 3rd, or 4th harmonic
                const removedHarmonic = removableHarmonics[prngRef.current.nextIntRange(0, removableHarmonics.length)];
                playToneSet(harmonics.filter(h => h !== removedHarmonic), () => setIsPlaying(false));
            }
        }, 1500);

    }, [engine, isPlaying]);
    
    useEffect(() => { 
        const timer = setTimeout(playComplexTones, 500);
        return () => clearTimeout(timer);
    }, [playComplexTones]);
    
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
    const [isPlaying, setIsPlaying] = useState(false);
    const [targetPan, setTargetPan] = useState<number>(0);
    const [feedback, setFeedback] = useState<string>('');
    const [score, setScore] = useState(0);
    const prngRef = useRef(new PRNG('spatial-seed'));

    // Define 5 discrete positions for clarity
    const positions = [
        { label: "Far Left", value: -1.0 },
        { label: "Left", value: -0.5 },
        { label: "Center", value: 0 },
        { label: "Right", value: 0.5 },
        { label: "Far Right", value: 1.0 },
    ];

    const playStimulus = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        // Pick a random position
        const randomIndex = Math.floor(prngRef.current.nextFloat() * positions.length);
        const selectedPosition = positions[randomIndex];
        setTargetPan(selectedPosition.value);

        // Play tone with panning
        engine.playTone({
            frequency: 440, // A4
            type: 'sawtooth', // Richer harmonics help localization
            duration: 0.5,
            pan: selectedPosition.value, 
            onEnd: () => setIsPlaying(false),
        });
    }, [engine, isPlaying, positions]);

    // Initial play
    useEffect(() => {
        const timer = setTimeout(() => playStimulus(), 500);
        return () => clearTimeout(timer);
    }, [playStimulus]);

    const handleGuess = (guessValue: number) => {
        if (isPlaying) return;

        const isCorrect = Math.abs(guessValue - targetPan) < 0.1;

        if (isCorrect) {
            setFeedback('Correct! You found the source.');
            setScore(s => s + 1);
            setTimeout(() => playStimulus(), 1000); // Auto-advance
        } else {
            setFeedback('Missed. Try again!');
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                    <Locate className="w-5 h-5" /> Sound Source
                </h3>
                <p className="text-sm text-muted-foreground">
                    Where did the sound come from? (Headphones Required)
                </p>
            </div>

            <div className="h-8 font-semibold text-lg">
                {feedback && (
                    <span className={feedback.startsWith('Correct') ? "text-green-400" : "text-rose-400"}>
                        {feedback}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-5 gap-2 w-full">
                {positions.map((pos) => (
                    <Button
                        key={pos.label}
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-violet-500/50 hover:bg-violet-500/20"
                        onClick={() => handleGuess(pos.value)}
                        disabled={isPlaying}
                    >
                        <div className={cn(
                            "w-3 h-3 rounded-full bg-violet-400",
                            pos.value === 0 ? "self-center" : (pos.value < 0 ? "self-start" : "self-end")
                        )} />
                        <span className="text-xs">{pos.label}</span>
                    </Button>
                ))}
            </div>

            <div className="flex gap-4 mt-4">
                <Button onClick={playStimulus} disabled={isPlaying} variant="secondary">
                    <RefreshCw className="mr-2 h-4 w-4" /> Replay Sound
                </Button>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
                Score: {score}
            </div>
        </div>
    );
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

        const baseFreq = 300;
        const stepUp = prngRef.current.nextFloat() > 0.5;
        answerRef.current = stepUp ? 1 : 0;

        const freqs = stepUp
            ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5]
            : [baseFreq * 1.5, baseFreq * 1.25, baseFreq];

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
        const timer = setTimeout(playPattern, 500);
        return () => clearTimeout(timer);
    }, [playPattern]);

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

const VOWELS = {
    Ah: [{ frequency: 730, type: 'triangle' as const }, { frequency: 1090, type: 'sine' as const }],
    Ee: [{ frequency: 270, type: 'triangle' as const }, { frequency: 2290, type: 'sine' as const }],
    Oo: [{ frequency: 300, type: 'triangle' as const }, { frequency: 870, type: 'sine' as const }],
};
type Vowel = keyof typeof VOWELS;

const SpeechProcessingModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVowel, setCurrentVowel] = useState<Vowel>('Ah');
    const prngRef = useRef(new PRNG('speech-seed'));

    const playVowelSound = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        const vowelToPlay = prngRef.current.shuffle(Object.keys(VOWELS) as Vowel[])[0];
        setCurrentVowel(vowelToPlay);

        const formants = VOWELS[vowelToPlay];
        const partials = formants.map(f => ({ ...f, volume: 0.25 }));

        engine.playComplexTone(partials, 0.5, { onEnd: () => setIsPlaying(false) });

    }, [engine, isPlaying]);

    useEffect(() => {
        const timer = setTimeout(playVowelSound, 500);
        return () => clearTimeout(timer);
    }, [playVowelSound]);

    const handleAnswer = (choice: Vowel) => {
        if (isPlaying) return;
        const isCorrect = choice === currentVowel;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => {
            onComplete();
            setFeedback('');
            playVowelSound();
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full text-violet-200">
            <p className="font-semibold text-lg">Which vowel sound did you hear?</p>
            <Button onClick={playVowelSound} disabled={isPlaying}>
                <RefreshCw className="mr-2 h-4 w-4" /> Replay Sound
            </Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                {(Object.keys(VOWELS) as Vowel[]).map(vowel => (
                    <Button key={vowel} onClick={() => handleAnswer(vowel)} disabled={isPlaying} className="h-24 text-2xl">
                        {vowel}
                    </Button>
                ))}
            </div>
        </div>
    );
};


const FOCUS_TO_GAME: Record<TrainingFocus, {
    title: string;
    Icon: React.ElementType;
    Component: React.FC<{ onComplete: () => void }>;
}> = {
    neutral: { title: "Pitch Discrimination", Icon: Waves, Component: PitchDiscriminationModule },
    math:    { title: "Rhythm Patterns",      Icon: Music, Component: MathMode },
    music:   { title: "Timbre Analysis",      Icon: Ear,   Component: SpectralDiscriminationModule },
    verbal:  { title: "Speech Processing",    Icon: Bot,   Component: SpeechProcessingModule },
    spatial: { title: "Sound Localization",   Icon: Locate, Component: EnhancedLocalizationModule },
    eq:      { title: "Intonation Detective",      Icon: Smile, Component: EQMode },
    logic:   { title: "Pattern Sequencing",   Icon: AudioLines, Component: PatternSequencingModule },
};


export default function AuditoryProcessingRouter() {
    const { engine, isReady, initializeAudio } = useAudioEngine();
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const effectiveFocus = isComponentLoaded ? (override || globalFocus) : 'neutral';

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
                 }} />
            </CardContent>
        </Card>
    );
}

