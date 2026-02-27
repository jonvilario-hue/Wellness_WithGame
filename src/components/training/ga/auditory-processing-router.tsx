'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useAudioEngine, type ToneConfig } from "@/hooks/useAudioEngine";
import { Headphones, Music, Waves, Ear, Locate, Brain, Bot, Loader2, RefreshCw } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import type { AssetId } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// --- Existing Modules ---
import { PitchDiscriminationModule } from './PitchDiscriminationModule';
import { RhythmJudgmentModule } from './RhythmJudgmentModule';
import { Menu } from './Menu';


// --- NEW & REVISED MODULES ---

const MelodyRecallModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const notes = useMemo(() => [
        { name: 'C', midi: 60 }, { name: 'D', midi: 62 }, { name: 'E', midi: 64 }, 
        { name: 'G', midi: 67 }, { name: 'A', midi: 69 }
    ], []);
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'recalling' | 'feedback'>('playing');
    const [feedback, setFeedback] = useState('');

    const startNewTrial = useCallback(() => {
        const newSequence = Array.from({ length: 4 }, () => notes[Math.floor(Math.random() * notes.length)].midi);
        setSequence(newSequence);
        setUserSequence([]);
        setFeedback('');
        setGameState('playing');
        if (engine) {
            engine.playSequence(newSequence.map(n => ({ frequency: engine.midiToFreq(n), duration: 0.3 })), 400, () => setGameState('recalling'));
        }
    }, [engine, notes]);

    useEffect(() => {
        startNewTrial();
    }, [startNewTrial]);

    const handleNoteClick = (note: number) => {
        if (gameState !== 'recalling') return;
        setUserSequence(prev => [...prev, note]);
    };
    
    const checkAnswer = () => {
        if(gameState !== 'recalling') return;
        const isCorrect = JSON.stringify(userSequence) === JSON.stringify(sequence);
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setGameState('feedback');
        setTimeout(() => onComplete(), 2000);
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">{gameState === 'playing' ? 'Memorize the melody...' : 'Recall the melody.'}</p>
            <div className="h-10 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="flex gap-2">
                {notes.map(note => (
                    <Button key={note.midi} onClick={() => handleNoteClick(note.midi)} disabled={gameState !== 'recalling'}>{note.name}</Button>
                ))}
            </div>
             <div className="h-12 p-2 border rounded-md min-w-[200px] text-center">{userSequence.map(n => notes.find(nt => nt.midi === n)?.name).join(' - ')}</div>
            <Button onClick={checkAnswer} disabled={gameState !== 'recalling' || userSequence.length === 0}>Submit</Button>
        </div>
    );
};

const SpeechInNoiseModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const words = useMemo(() => ["apple", "table", "river", "house", "window", "pencil"], []);
    const [targetWord, setTargetWord] = useState('');
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState('');

    const startNewTrial = useCallback(() => {
        if (!engine) return;
        const newWord = words[Math.floor(Math.random() * words.length)];
        setTargetWord(newWord);
        setUserInput('');
        setFeedback('');

        engine.playSpeechShapedNoise?.(2, 0.4);
        setTimeout(() => engine.speak(newWord), 500);
    }, [engine, words]);

    useEffect(() => {
        startNewTrial();
    }, [startNewTrial]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isCorrect = userInput.trim().toLowerCase() === targetWord.toLowerCase();
        setFeedback(isCorrect ? 'Correct!' : `Incorrect. The word was "${targetWord}".`);
        setTimeout(() => onComplete(), 2000);
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">What word did you hear in the noise?</p>
            <Button onClick={startNewTrial}>Replay</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback.includes('Incorrect') ? 'text-rose-400' : 'text-green-400')}>{feedback}</p>}</div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input value={userInput} onChange={e => setUserInput(e.target.value)} autoFocus/>
                <Button type="submit">Submit</Button>
            </form>
        </div>
    )
}

const ProsodyContourModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<'rising' | 'falling' | null>(null);

    const playContour = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        const isRising = Math.random() > 0.5;
        answerRef.current = isRising ? 'rising' : 'falling';
        const sequence: ToneConfig[] = isRising
            ? [{freq: 200}, {freq: 250}, {freq: 300}, {freq: 350}].map(c => ({...c, duration: 0.1, type: 'sine'}))
            : [{freq: 350}, {freq: 300}, {freq: 250}, {freq: 200}].map(c => ({...c, duration: 0.1, type: 'sine'}));
        engine.playSequence(sequence, 100, () => setIsPlaying(false));
    }, [engine, isPlaying]);

    useEffect(() => { playContour() }, [playContour]);

    const handleAnswer = (choice: 'rising' | 'falling') => {
        if (choice === answerRef.current) onComplete();
        else {
            alert('Incorrect!');
            onComplete();
        }
    };
    
    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Did the tone rise or fall?</p>
            <Button onClick={playContour} disabled={isPlaying}>Replay</Button>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleAnswer('rising')} disabled={isPlaying}>Rising</Button>
                <Button onClick={() => handleAnswer('falling')} disabled={isPlaying}>Falling</Button>
            </div>
        </div>
    )
};

const SpectralDiscriminationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<'same' | 'different' | null>(null);

    const playComplexTones = useCallback(() => {
        if (!engine?.audioContext || isPlaying) return;
        setIsPlaying(true);
        const isSame = Math.random() > 0.5;
        answerRef.current = isSame ? 'same' : 'different';

        const fundamental = 220; // A3
        const harmonics = [1, 2, 3, 4, 5, 6];
        
        const playToneSet = (harmonicsToPlay: number[]) => {
            harmonicsToPlay.forEach(h => {
                engine.playTone({ frequency: fundamental * h, duration: 1, volume: 0.2 / h, type: 'sine' });
            });
        };
        
        playToneSet(harmonics); // Play full tone
        
        setTimeout(() => {
            if (isSame) {
                playToneSet(harmonics);
            } else {
                const removedHarmonic = harmonics[Math.floor(Math.random() * (harmonics.length -1)) + 1];
                playToneSet(harmonics.filter(h => h !== removedHarmonic));
            }
            setTimeout(() => setIsPlaying(false), 1100);
        }, 1500);

    }, [engine, isPlaying]);
    
    useEffect(() => { playComplexTones() }, []);
    
    const handleAnswer = (choice: 'same' | 'different') => {
        if(choice === answerRef.current) alert('Correct!'); else alert('Incorrect!');
        onComplete();
    };

    return (
         <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Are the two complex tones the same or different?</p>
            <Button onClick={playComplexTones} disabled={isPlaying}>Replay</Button>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleAnswer('same')} disabled={isPlaying}>Same</Button>
                <Button onClick={() => handleAnswer('different')} disabled={isPlaying}>Different</Button>
            </div>
        </div>
    )
};

const EnhancedLocalizationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['perc-click'], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);
    const [feedback, setFeedback] = useState('');
    const answerRef = useRef<number>(0);
    const positions = useMemo(() => [-0.9, -0.45, 0, 0.45, 0.9], []);

    const playSpatialSound = useCallback(() => {
        if (!engine || isLoading) return;
        const randomIndex = Math.floor(Math.random() * positions.length);
        answerRef.current = randomIndex;
        engine.playSample('perc-click', { pan: positions[randomIndex] });
        setFeedback('');
    }, [engine, isLoading, positions]);
    
    useEffect(() => { if (!isLoading) playSpatialSound(); }, [isLoading, playSpatialSound]);

    const handleAnswer = (choiceIndex: number) => {
        const isCorrect = choiceIndex === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

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

// --- Main Router Component ---

type GaMode = 'pitch' | 'timing' | 'timbre' | 'recall' | 'segregation' | 'localization' | 'prosody';

const modeConfig: Record<GaMode, { title: string, Icon: React.ElementType, Component: React.FC<{ onComplete: () => void }> }> = {
    pitch: { title: "Pitch", Icon: Waves, Component: PitchDiscriminationModule },
    timing: { title: "Rhythm", Icon: Music, Component: RhythmJudgmentModule },
    timbre: { title: "Timbre", Icon: Ear, Component: SpectralDiscriminationModule },
    recall: { title: "Melody Recall", Icon: Brain, Component: MelodyRecallModule },
    segregation: { title: "Segregation", Icon: Bot, Component: SpeechInNoiseModule },
    localization: { title: "Localization", Icon: Locate, Component: EnhancedLocalizationModule },
    prosody: { title: "Prosody", Icon: Headphones, Component: ProsodyContourModule },
};

export default function AuditoryProcessingRouter() {
    const [activeMode, setActiveMode] = useState<'menu' | GaMode>('menu');
    const { engine } = useAudioEngine();

    const handleSelectMode = useCallback((mode: GaMode) => {
        engine?.resumeContext();
        setActiveMode(mode);
    }, [engine]);

    const handleModeComplete = useCallback(() => {
        setActiveMode('menu');
    }, []);

    const renderActiveMode = () => {
        if (activeMode === 'menu') {
            const modesForMenu = (Object.keys(modeConfig) as GaMode[]).map(key => ({
                key,
                title: modeConfig[key].title,
                Icon: modeConfig[key].Icon,
            }));
            return <Menu onSelectMode={handleSelectMode as any} modes={modesForMenu} />;
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
