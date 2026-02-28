
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useAudioEngine, type ToneConfig } from "@/hooks/useAudioEngine";
import { Headphones, Music, Waves, Ear, Locate, Brain, Bot, Loader2, RefreshCw } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { PRNG } from '@/lib/rng';
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";


// --- Procedural Modules ---

const PitchDiscriminationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<'higher' | 'lower'>('higher');
    const prngRef = useRef(new PRNG('pitch-seed'));

    const handlePlay = useCallback(() => {
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

    useEffect(() => { handlePlay() }, [handlePlay]);

    return (
        <div className="flex flex-col items-center gap-4 w-full text-violet-200">
            <p className="font-semibold text-lg">Was the second tone higher or lower?</p>
            <Button onClick={handlePlay} disabled={isPlaying}><RefreshCw className="mr-2 h-4 w-4"/> Replay</Button>
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
    const answerRef = useRef<'same' | 'different' | null>(null);
    const prngRef = useRef(new PRNG('spectral-seed'));

    const playComplexTones = useCallback(() => {
        if (!engine?.audioContext || isPlaying) return;
        setIsPlaying(true);
        const isSame = prngRef.current.nextFloat() > 0.5;
        answerRef.current = isSame ? 'same' : 'different';

        const fundamental = 220; // A3
        const harmonics = [1, 2, 3, 4, 5, 6];
        
        const playToneSet = (partials: number[]) => {
            const partialConfigs = partials.map(h => ({
                frequency: fundamental * h,
                volume: 0.2 / h,
                type: 'sine' as OscillatorType,
            }));
           engine.playComplexTone(partialConfigs, 1.0);
        };
        
        playToneSet(harmonics); // Play full tone
        
        setTimeout(() => {
            if (isSame) {
                playToneSet(harmonics);
            } else {
                const removedHarmonic = harmonics[prngRef.current.nextIntRange(1, harmonics.length)];
                playToneSet(harmonics.filter(h => h !== removedHarmonic));
            }
            setTimeout(() => setIsPlaying(false), 1100);
        }, 1500);

    }, [engine, isPlaying]);
    
    useEffect(() => { playComplexTones() }, [playComplexTones]);
    
    const handleAnswer = (choice: 'same' | 'different') => {
        if(choice === answerRef.current) setFeedback('Correct!')
        else setFeedback('Incorrect.');
        setTimeout(onComplete, 1500);
    };
    
    const [feedback, setFeedback] = useState('');

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
    const answerRef = useRef<number>(0);
    const positions = useMemo(() => [-0.9, -0.45, 0, 0.45, 0.9], []);
    const prngRef = useRef(new PRNG('localization-seed'));

    const playSpatialSound = useCallback(() => {
        if (!engine) return;
        const randomIndex = prngRef.current.nextIntRange(0, positions.length);
        answerRef.current = randomIndex;
        engine.playTone({ frequency: 880, duration: 0.15, type: 'sine', pan: positions[randomIndex], volume: 0.6 });
        setFeedback('');
    }, [engine, positions]);
    
    useEffect(() => { playSpatialSound(); }, [playSpatialSound]);

    const handleAnswer = (choiceIndex: number) => {
        const isCorrect = choiceIndex === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    return (
         <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Where did the sound come from?</p>
            <Button onClick={playSpatialSound}><RefreshCw className="mr-2 h-4 w-4"/> Replay</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-5 gap-2 w-full max-w-lg">
                {positions.map((_, index) => (
                    <Button key={index} onClick={() => handleAnswer(index)} className="h-16 text-lg">{index + 1}</Button>
                ))}
            </div>
        </div>
    )
};


// --- Menu & Router ---
const Menu = ({ onSelectMode, modes }: { onSelectMode: (mode: GaMode) => void, modes: any[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center w-full max-w-2xl">
    {modes.map(mode => {
      const { Icon, title, key } = mode;
      return (
        <Card key={key} className="bg-violet-900 hover:bg-violet-800 transition-colors cursor-pointer" onClick={() => onSelectMode(key)}>
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <Icon className="w-8 h-8 text-violet-400" />
            <p className="font-semibold text-violet-100">{title}</p>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

type GaMode = 'pitch' | 'timbre' | 'localization' | 'rhythm' | 'memory' | 'speech' | 'prosody';

const modeConfig: Record<string, { title: string, Icon: React.ElementType, Component: React.FC<{ onComplete: () => void }> }> = {
    pitch: { title: "Pitch", Icon: Waves, Component: PitchDiscriminationModule },
    timbre: { title: "Timbre", Icon: Ear, Component: SpectralDiscriminationModule },
    localization: { title: "Localization", Icon: Locate, Component: EnhancedLocalizationModule },
    rhythm: { title: "Rhythm", Icon: Music, Component: () => <p>Rhythm Module WIP</p> },
    memory: { title: "Memory", Icon: Brain, Component: () => <p>Memory Module WIP</p> },
    speech: { title: "Speech", Icon: Bot, Component: () => <p>Speech Module WIP</p> },
};

export default function AuditoryProcessingRouter() {
    const { engine, isReady, initializeAudio } = useAudioEngine();
    const [activeMode, setActiveMode] = useState<'menu' | GaMode>('menu');
    const { focus: globalFocus } = useTrainingFocus();
    const { override } = useTrainingOverride();
    const effectiveFocus = override || globalFocus;

    useEffect(() => {
        // When the focus tab changes, reset the lab to its menu.
        setActiveMode('menu');
    }, [effectiveFocus]);


    const handleSelectMode = useCallback((mode: GaMode) => {
        setActiveMode(mode);
    }, []);

    const handleModeComplete = useCallback(() => {
        setActiveMode('menu');
    }, []);
    
    useEffect(() => {
        // This effect runs whenever the activeMode changes.
        // The returned function is a cleanup function. It will run
        // BEFORE the effect runs the next time (e.g., when a new mode is selected)
        // and also when the component unmounts.
        return () => {
            engine?.stopAll();
        }
    }, [activeMode, engine]);
    
    if (!isReady) {
        return (
             <Card className="w-full max-w-3xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
                 <CardContent className="flex flex-col items-center justify-center gap-4 min-h-[450px]">
                    <h2 className="text-2xl font-bold">Enable Audio</h2>
                    <p className="text-muted-foreground text-center">Click the button below to start the audio engine for the Auditory Lab.</p>
                    <Button onClick={initializeAudio} size="lg"><Headphones className="mr-2"/> Enable Audio</Button>
                 </CardContent>
             </Card>
        )
    }

    const renderActiveMode = () => {
        if (activeMode === 'menu') {
            const modesForMenu = (Object.keys(modeConfig) as GaMode[]).map(key => ({
                key,
                title: modeConfig[key].title,
                Icon: modeConfig[key].Icon,
            }));
            return <Menu onSelectMode={handleSelectMode} modes={modesForMenu} />;
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
