
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Loader2, Check, X, RefreshCw } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

// Types
type TrialType = 'pitch' | 'duration' | 'loudness';
type Trial = {
  type: TrialType;
  toneA: { freq: number; duration: number; gain: number };
  toneB: { freq: number; duration: number; gain: number };
  isSame: boolean;
  question: string;
};

const TRIALS_PER_ROUND = 20;

// Difficulty Levels
const difficultyLevels = {
  1: { pitchDelta: 100, durationDelta: 200, loudnessDelta: 0.5, noiseGain: 0 },
  2: { pitchDelta: 60, durationDelta: 120, loudnessDelta: 0.35, noiseGain: 0 },
  3: { pitchDelta: 40, durationDelta: 80, loudnessDelta: 0.2, noiseGain: 0.05 }, // SNR ~+12dB
  4: { pitchDelta: 20, durationDelta: 40, loudnessDelta: 0.1, noiseGain: 0.1 },  // SNR ~+6dB
  5: { pitchDelta: 10, durationDelta: 20, loudnessDelta: 0.05, noiseGain: 0.15 }, // SNR ~+3dB
};
const MAX_LEVEL = 5;

// Stimulus Generation
const generateTrial = (level: number): Trial => {
  const config = difficultyLevels[level as keyof typeof difficultyLevels] || difficultyLevels[MAX_LEVEL];
  const trialTypes: TrialType[] = ['pitch', 'duration', 'loudness'];
  const type = trialTypes[Math.floor(Math.random() * trialTypes.length)];
  const isSame = Math.random() > 0.5;

  const baseFreq = 300 + Math.random() * 500; // 300-800 Hz
  const baseDuration = 0.3; // 300ms
  const baseGain = 0.5;

  let toneA = { freq: baseFreq, duration: baseDuration, gain: baseGain };
  let toneB = { ...toneA };
  let question = '';

  switch (type) {
    case 'pitch':
      question = "Is the second tone HIGHER or LOWER?";
      if (!isSame) {
        const cents = Math.random() > 0.5 ? config.pitchDelta : -config.pitchDelta;
        toneB.freq = toneA.freq * Math.pow(2, cents / 1200);
      }
      break;
    case 'duration':
      question = "Is the second tone LONGER or SHORTER?";
      if (!isSame) {
        const durationChange = config.durationDelta / 1000;
        toneB.duration = Math.random() > 0.5 ? toneA.duration + durationChange : Math.max(0.1, toneA.duration - durationChange);
      }
      break;
    case 'loudness':
      question = "Is the second tone LOUDER or SOFTER?";
      if (!isSame) {
        const gainChange = config.loudnessDelta;
        toneB.gain = Math.random() > 0.5 ? toneA.gain + gainChange : Math.max(0.1, toneA.gain - gainChange);
      }
      break;
  }
  
  if (isSame) {
      question = "Are the tones the SAME or DIFFERENT?";
  }

  return { type, toneA, toneB, isSame, question };
};

export default function CoreMode() {
  const { engine } = useAudioEngine();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'feedback' | 'summary'>('idle');
  const [trial, setTrial] = useState<Trial | null>(null);
  const [level, setLevel] = useState(1);
  const [trialCount, setTrialCount] = useState(0);
  const [results, setResults] = useState<{ correct: boolean, rt: number }[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean, show: boolean }>({ correct: false, show: false });
  const [replaysLeft, setReplaysLeft] = useState(2);
  const trialStartTime = useRef(0);

  const playStimulus = useCallback(() => {
    if (!engine || !trial) return;
    engine.stopAll();
    const config = difficultyLevels[level as keyof typeof difficultyLevels];
    if (config.noiseGain > 0 && engine.playPinkNoise) {
      engine.playPinkNoise(1.5, config.noiseGain);
    }
    engine.playTone({ frequency: trial.toneA.freq, duration: trial.toneA.duration, volume: trial.toneA.gain });
    setTimeout(() => {
      engine.playTone({ frequency: trial.toneB.freq, duration: trial.toneB.duration, volume: trial.toneB.gain });
    }, (trial.toneA.duration + 0.3) * 1000); // 300ms ISI
  }, [engine, trial, level]);
  
  const handleReplay = () => {
    if (replaysLeft > 0 && gameState === 'playing') {
      setReplaysLeft(r => r - 1);
      playStimulus();
    }
  }

  const startNextTrial = useCallback(() => {
    if (trialCount >= TRIALS_PER_ROUND) {
      setGameState('summary');
      return;
    }
    const newTrial = generateTrial(level);
    setTrial(newTrial);
    setTrialCount(c => c + 1);
    setReplaysLeft(2);
    setFeedback({ correct: false, show: false });
    setGameState('playing');
  }, [level, trialCount]);
  
  useEffect(() => {
      if (gameState === 'playing' && trial) {
          trialStartTime.current = Date.now();
          playStimulus();
      }
  }, [gameState, trial, playStimulus]);

  const handleStart = () => {
    engine?.resumeContext();
    setLevel(1);
    setTrialCount(0);
    setResults([]);
    startNextTrial();
  };

  const handleResponse = (userAnswer: 'same' | 'different' | 'higher' | 'lower') => {
    if (gameState !== 'playing' || !trial) return;

    const rt = Date.now() - trialStartTime.current;
    let correct = false;
    if(trial.isSame) {
        correct = userAnswer === 'same';
    } else {
        if(userAnswer === 'different') {
            correct = true;
        } else if (trial.type === 'pitch') {
            correct = (userAnswer === 'higher' && trial.toneB.freq > trial.toneA.freq) || (userAnswer === 'lower' && trial.toneB.freq < trial.toneA.freq);
        } else if (trial.type === 'duration') {
            correct = (userAnswer === 'higher' && trial.toneB.duration > trial.toneA.duration) || (userAnswer === 'lower' && trial.toneB.duration < trial.toneA.duration);
        } else if (trial.type === 'loudness') {
             correct = (userAnswer === 'higher' && trial.toneB.gain > trial.toneA.gain) || (userAnswer === 'lower' && trial.toneB.gain < trial.toneA.gain);
        }
    }
    
    setResults(prev => [...prev, { correct, rt }]);
    setGameState('feedback');
    setFeedback({ correct, show: true });

    // Staircase logic: 2-down/1-up
    const newResults = [...results, {correct, rt}];
    const lastTwo = newResults.slice(-2);
    if (correct && lastTwo.length === 2 && lastTwo.every(r => r.correct)) {
        setLevel(l => Math.min(MAX_LEVEL, l + 1));
        setResults([]); // Reset streak count on level up
    } else if (!correct) {
        setLevel(l => Math.max(1, l - 1));
        setResults([]); // Reset streak on incorrect
    }

    setTimeout(() => {
      startNextTrial();
    }, 1500);
  };
  
  const summary = useMemo(() => {
      if(results.length === 0 && trialCount === 0) return { accuracy: 0, avgRt: 0};
      // Note: This is an approximation since we reset results on level change
      const correctCount = results.filter(r => r.correct).length;
      const totalCount = results.length;
      const totalRt = results.filter(r => r.correct).reduce((sum, r) => sum + r.rt, 0);
      return {
          accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
          avgRt: totalRt / (correctCount || 1),
      }
  }, [results, trialCount]);

  useEffect(() => {
    return () => {
        engine?.stopAll();
    }
  }, [engine]);

  if (!engine) {
    return <div>Audio engine not available.</div>;
  }

  return (
    <Card className="w-full max-w-xl text-center bg-violet-950 border-violet-500/30 text-violet-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
          <span className="p-2 bg-violet-500/10 rounded-md"><domainIcons.Ga className="w-6 h-6 text-violet-400" /></span>
          Signal Discrimination Gym
        </CardTitle>
        <CardDescription className="text-violet-300/70">Listen closely and identify subtle differences in sound.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
        {gameState === 'idle' && (
          <Button onClick={handleStart} size="lg" className="bg-violet-600 hover:bg-violet-500 text-white">Start Round</Button>
        )}
        {gameState === 'summary' && (
            <div className="flex flex-col items-center gap-4 text-violet-200">
                <CardTitle>Round Complete!</CardTitle>
                <div className="text-lg">Final Level: <span className="font-bold text-violet-300">{level}</span></div>
                <Button onClick={handleStart} size="lg" className="mt-4 bg-violet-600 hover:bg-violet-500 text-white">Play Again</Button>
            </div>
        )}
        {(gameState === 'playing' || gameState === 'feedback') && trial && (
          <>
            <div className="w-full flex justify-between font-mono text-violet-200 px-4">
                <span>Trial: {trialCount}/{TRIALS_PER_ROUND}</span>
                <span>Level: {level}</span>
            </div>
             <p className="font-semibold text-lg h-12 text-center text-violet-200">{trial.question}</p>
             <div className="h-10">
                {feedback.show && (
                    feedback.correct ? 
                    <Check className="w-10 h-10 text-green-400 animate-in fade-in" /> : 
                    <X className="w-10 h-10 text-rose-400 animate-in fade-in" />
                )}
             </div>
             <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {trial.isSame ? (
                    <>
                        <Button onClick={() => handleResponse('same')} disabled={gameState === 'feedback'} className="h-24 text-2xl">Same</Button>
                        <Button onClick={() => handleResponse('different')} disabled={gameState === 'feedback'} className="h-24 text-2xl">Different</Button>
                    </>
                ) : (
                     <>
                        <Button onClick={() => handleResponse('lower')} disabled={gameState === 'feedback'} className="h-24 text-2xl">
                          {trial.type === 'pitch' ? 'Lower' : trial.type === 'duration' ? 'Shorter' : 'Softer'}
                        </Button>
                        <Button onClick={() => handleResponse('higher')} disabled={gameState === 'feedback'} className="h-24 text-2xl">
                          {trial.type === 'pitch' ? 'Higher' : trial.type === 'duration' ? 'Longer' : 'Louder'}
                        </Button>
                    </>
                )}
             </div>
             <div className="h-10 mt-2">
                <Button onClick={handleReplay} variant="ghost" disabled={replaysLeft === 0 || gameState === 'feedback'}>
                    <RefreshCw className="mr-2 w-4 h-4"/> Replay ({replaysLeft})
                </Button>
             </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
