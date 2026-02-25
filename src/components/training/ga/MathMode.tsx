'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Loader2, Check, X, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToneConfig } from "@/lib/audio/AudioEngine";


// --- Types and Constants ---
const TRIALS_PER_ROUND = 20;
const MAX_LEVEL = 5;

type TaskType = 'count' | 'ratio';

type CountPuzzle = {
  type: 'count';
  count: number;
  bpm: number;
};

type RatioPuzzle = {
  type: 'ratio';
  baseBpm: number;
  ratio: number;
  ratioLabel: string;
};

type Puzzle = CountPuzzle | RatioPuzzle;

const difficultySettings = {
  1: { countRange: [3, 5], bpmRange: [120, 180], ratios: [1, 2], noiseGain: 0, volumeJitter: 0 },
  2: { countRange: [4, 7], bpmRange: [180, 240], ratios: [0.5, 1, 2], noiseGain: 0, volumeJitter: 0 },
  3: { countRange: [5, 9], bpmRange: [240, 300], ratios: [0.5, 1, 1.5, 2], noiseGain: 0.01, volumeJitter: 0 },
  4: { countRange: [6, 12], bpmRange: [300, 360], ratios: [0.5, 2/3, 1, 1.5, 2], noiseGain: 0.03, volumeJitter: 0.05 },
  5: { countRange: [8, 15], bpmRange: [360, 420], ratios: [0.5, 2/3, 1, 1.5, 2], noiseGain: 0.05, volumeJitter: 0.1 },
};

const ratioLabels: Record<number, string> = {
  0.5: 'Half Speed',
  [2/3]: 'Slower (2/3)',
  1: 'Same Speed',
  1.5: 'Faster (1.5x)',
  2: 'Double Speed',
};

// --- Main Component ---
export default function MathMode({ onComplete }: { onComplete: () => void }) {
  const { engine } = useAudioEngine();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'feedback' | 'summary'>('idle');
  const [level, setLevel] = useState(1);
  const [trialCount, setTrialCount] = useState(0);
  const [score, setScore] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string; show: boolean }>({ correct: false, message: '', show: false });
  const [replaysLeft, setReplaysLeft] = useState(1);

  const correctStreak = useRef(0);
  const lastTaskType = useRef<TaskType>('ratio');

  const generateClickSequence = useCallback((count: number, bpm: number, volumeJitter: number) => {
    if (!engine) return;
    const intervalMs = 60000 / bpm;
    const tones: ToneConfig[] = Array.from({ length: count }, () => {
      const jitter = (Math.random() * volumeJitter) - (volumeJitter / 2);
      return {
        frequency: 1000,
        duration: 0.01, // 10ms click
        volume: 0.8 + jitter,
        type: 'sine' as OscillatorType,
      };
    });
    engine.playSequence(tones, intervalMs);
  }, [engine]);

  const playStimulus = useCallback(() => {
    if (!engine || !puzzle) return;
    engine.stopAll();
    
    const config = difficultySettings[level as keyof typeof difficultySettings];
    if (config.noiseGain > 0 && engine.playPinkNoise) {
      engine.playPinkNoise(3, config.noiseGain);
    }
    
    if (puzzle.type === 'count') {
      generateClickSequence(puzzle.count, puzzle.bpm, config.volumeJitter);
    } else { // ratio
      generateClickSequence(8, puzzle.baseBpm, 0); // Reference train is always clean
      setTimeout(() => {
        generateClickSequence(8, puzzle.baseBpm * puzzle.ratio, config.volumeJitter);
      }, (8 * (60000 / puzzle.baseBpm)) + 800); // 800ms gap
    }
  }, [engine, puzzle, level, generateClickSequence]);

  const handleReplay = () => {
    if (replaysLeft > 0 && gameState === 'playing') {
      setReplaysLeft(r => r - 1);
      playStimulus();
    }
  };

  const startNextTrial = useCallback(() => {
    if (trialCount >= TRIALS_PER_ROUND) {
      setGameState('summary');
      return;
    }
    const config = difficultySettings[level as keyof typeof difficultySettings];
    const taskType: TaskType = lastTaskType.current === 'count' ? 'ratio' : 'count';
    lastTaskType.current = taskType;

    let newPuzzle: Puzzle;
    if (taskType === 'count') {
      const count = Math.floor(Math.random() * (config.countRange[1] - config.countRange[0] + 1)) + config.countRange[0];
      const bpm = Math.floor(Math.random() * (config.bpmRange[1] - config.bpmRange[0] + 1)) + config.bpmRange[0];
      newPuzzle = { type: 'count', count, bpm };
    } else {
      const baseBpm = Math.floor(Math.random() * (160 - 100 + 1)) + 100;
      const ratioKey = config.ratios[Math.floor(Math.random() * config.ratios.length)];
      const ratio = typeof ratioKey === 'string' ? parseFloat(ratioKey) : ratioKey;
      newPuzzle = { type: 'ratio', baseBpm, ratio, ratioLabel: ratioLabels[ratio] };
    }

    setPuzzle(newPuzzle);
    setTrialCount(c => c + 1);
    setReplaysLeft(1);
    setFeedback({ correct: false, message: '', show: false });
    setGameState('playing');
  }, [level, trialCount]);
  
  useEffect(() => {
    if (gameState === 'playing') {
      playStimulus();
    }
  }, [gameState, puzzle, playStimulus]);

  const handleStart = () => {
    engine?.resumeContext();
    setLevel(1);
    setTrialCount(0);
    setScore(0);
    correctStreak.current = 0;
    startNextTrial();
  };

  const handleResponse = (userAnswer: number | string) => {
    if (gameState !== 'playing' || !puzzle) return;

    let isCorrect = false;
    let message = "Incorrect";
    
    if (puzzle.type === 'count' && typeof userAnswer === 'number') {
      const diff = Math.abs(userAnswer - puzzle.count);
      if (diff === 0) { isCorrect = true; setScore(s => s + 1); message = "Correct!"; }
      else if (diff === 1) { setScore(s => s + 0.5); message = `Close! It was ${puzzle.count}.`; }
      else { message = `Not quite. The answer was ${puzzle.count}.`; }

    } else if (puzzle.type === 'ratio' && typeof userAnswer === 'string') {
      isCorrect = userAnswer === puzzle.ratioLabel;
      if (isCorrect) { setScore(s => s + 1); message = "Correct!"; }
      else { message = `The answer was ${puzzle.ratioLabel}.`; }
    }
    
    setGameState('feedback');
    setFeedback({ correct: isCorrect, message, show: true });

    if(isCorrect) {
        correctStreak.current++;
        if(correctStreak.current >= 2) {
            setLevel(l => Math.min(MAX_LEVEL, l+1));
            correctStreak.current = 0;
        }
    } else {
        correctStreak.current = 0;
        setLevel(l => Math.max(1, l-1));
    }

    setTimeout(() => {
      startNextTrial();
    }, 2500);
  };
  
  return (
    <Card className="w-full max-w-2xl text-center bg-blue-900 border-blue-500/30 text-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-blue-300">
          <Calculator className="w-6 h-6" /> Rhythm Arithmetic
        </CardTitle>
        <CardDescription className="text-blue-300/70">Analyze auditory patterns to solve quantitative puzzles.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
        {gameState === 'idle' && <Button onClick={handleStart} size="lg">Start Round</Button>}
        {gameState === 'summary' && (
            <div className="flex flex-col items-center gap-4 text-blue-200">
                <CardTitle>Round Complete!</CardTitle>
                <div className="text-lg">Final Score: <span className="font-bold text-blue-300">{score.toFixed(1)} / {TRIALS_PER_ROUND}</span></div>
                <div className="text-lg">Peak Level: <span className="font-bold text-blue-300">{level}</span></div>
                <Button onClick={handleStart} size="lg" className="mt-4">Play Again</Button>
            </div>
        )}
        {(gameState === 'playing' || gameState === 'feedback') && puzzle && (
          <>
            <div className="w-full flex justify-between font-mono text-blue-200 px-4">
                <span>Trial: {trialCount}/{TRIALS_PER_ROUND}</span>
                <span>Level: {level}</span>
            </div>
            
            <p className="font-semibold text-lg h-12 text-center text-blue-200">
              {puzzle.type === 'count' ? 'How many clicks did you hear?' : 'What is the ratio of the second tempo to the first?'}
            </p>
            
            <div className="h-10">
                {feedback.show && (
                    feedback.correct ? 
                    <Check className="w-10 h-10 text-green-400 animate-in fade-in" /> : 
                    <X className="w-10 h-10 text-rose-400 animate-in fade-in" />
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {puzzle.type === 'count' ? (
                Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
                  <Button key={num} onClick={() => handleResponse(num)} disabled={gameState === 'feedback'}>
                    {num}
                  </Button>
                ))
              ) : (
                Object.values(ratioLabels).map(label => (
                  <Button key={label} onClick={() => handleResponse(label)} disabled={gameState === 'feedback'} className="h-16 text-lg">
                    {label}
                  </Button>
                ))
              )}
            </div>

            <div className="h-10 mt-2">
                <Button onClick={handleReplay} variant="ghost" disabled={replaysLeft === 0 || gameState === 'feedback'}>
                    Replay ({replaysLeft})
                </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
