
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioEngine, type TonePlaybackHandle } from "@/hooks/useAudioEngine";
import { Loader2, Headphones, Check, RefreshCw } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

const TRIALS_PER_ROUND = 20;

const difficultySettings = {
  1: { positions: 3, distractors: 0, pingDuration: 155, responseTime: 3000 },
  2: { positions: 5, distractors: 0, pingDuration: 155, responseTime: 2800 },
  3: { positions: 5, distractors: 1, pingDuration: 100, responseTime: 2500 },
  4: { positions: 7, distractors: 2, pingDuration: 80, responseTime: 2200 },
  5: { positions: 9, distractors: 2, pingDuration: 60, responseTime: 2000, movingDistractors: true },
};

type Trial = {
  targetPan: number;
  distractors: { pan: number, freq: number }[];
};

export default function SpatialMode() {
  const { engine } = useAudioEngine();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'feedback' | 'summary'>('idle');
  const [level, setLevel] = useState(1);
  const [trialCount, setTrialCount] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean, userChoice: number, correctChoice: number } | null>(null);
  const [replaysLeft, setReplaysLeft] = useState(1);
  const [trial, setTrial] = useState<Trial | null>(null);
  
  const distractorHandles = useRef<TonePlaybackHandle[]>([]);

  const startNextTrial = useCallback(() => {
    if (!engine) return;
    if (trialCount >= TRIALS_PER_ROUND) {
      setGameState('summary');
      return;
    }
    
    // Stop previous distractors
    distractorHandles.current.forEach(h => h.stop());
    distractorHandles.current = [];

    const config = difficultySettings[level as keyof typeof difficultySettings];
    const positions = Array.from({ length: config.positions }, (_, i) => -1 + (i * (2 / (config.positions - 1))));
    const targetPan = positions[Math.floor(Math.random() * positions.length)];
    
    const distractors: { pan: number, freq: number }[] = [];
    for(let i=0; i<config.distractors; i++) {
        const distractorPan = positions.filter(p => p !== targetPan)[i];
        distractors.push({ pan: distractorPan, freq: 400 + Math.random() * 200 });
    }
    
    setTrial({ targetPan, distractors });
    setFeedback(null);
    setReplaysLeft(1);
    setGameState('playing');
    setTrialCount(c => c + 1);

    // Play stimuli
    engine.playTone({ frequency: 1000, duration: config.pingDuration / 1000, volume: 0.8, pan: targetPan, type: 'sine' });
    distractors.forEach(d => {
        const handle = engine.playTone({ frequency: d.freq, duration: config.responseTime / 1000, volume: 0.15, pan: d.pan, type: 'sawtooth' });
        if (handle) distractorHandles.current.push(handle);
    });

  }, [engine, level, trialCount]);

  const handleStart = () => {
    engine?.resumeContext();
    setLevel(1);
    setTrialCount(0);
    setScore(0);
    startNextTrial();
  };
  
  const handleReplay = () => {
    if (replaysLeft > 0 && gameState === 'playing' && trial && engine) {
        setReplaysLeft(r => r-1);
        const config = difficultySettings[level as keyof typeof difficultySettings];
        engine.playTone({ frequency: 1000, duration: config.pingDuration / 1000, volume: 0.8, pan: trial.targetPan, type: 'sine' });
    }
  };

  const handleResponse = (userPan: number) => {
    if (gameState !== 'playing' || !trial) return;

    distractorHandles.current.forEach(h => h.stop());
    distractorHandles.current = [];

    const config = difficultySettings[level as keyof typeof difficultySettings];
    const positions = Array.from({ length: config.positions }, (_, i) => -1 + (i * (2 / (config.positions - 1))));
    
    const correctIndex = positions.findIndex(p => Math.abs(p - trial.targetPan) < 0.01);
    const userIndex = positions.findIndex(p => Math.abs(p - userPan) < 0.01);

    const isCorrect = userIndex === correctIndex;

    if(isCorrect) {
        setScore(s => s + 1);
        // Staircase: 2 correct in a row to level up
        if(feedback?.correct) setLevel(l => Math.min(5, l + 1));
    } else {
        setLevel(l => Math.max(1, l - 1));
    }

    setGameState('feedback');
    setFeedback({ correct: isCorrect, userChoice: userIndex, correctChoice: correctIndex });

    setTimeout(() => {
      startNextTrial();
    }, 2000);
  };
  
  useEffect(() => {
      return () => { // Cleanup on unmount
          distractorHandles.current.forEach(h => h.stop());
      }
  }, []);

  return (
    <Card className="w-full max-w-2xl text-center bg-gray-900 border-gray-500/30 text-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-gray-300">
          <span className="p-2 bg-gray-500/10 rounded-md"><domainIcons.Ga className="w-6 h-6 text-gray-400" /></span>
          Sound Navigator
        </CardTitle>
        <CardDescription className="text-gray-300/70"><Headphones className="inline-block mr-2" />Put on headphones and identify the sound's location.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {gameState === 'idle' && <Button onClick={handleStart} size="lg" className="bg-gray-600 hover:bg-gray-500 text-white">Start</Button>}
        {gameState === 'summary' && (
            <div className="flex flex-col items-center gap-4 text-gray-200">
                <CardTitle>Round Complete!</CardTitle>
                <div className="text-lg">Final Score: <span className="font-bold text-gray-300">{score} / {TRIALS_PER_ROUND}</span></div>
                <div className="text-lg">Peak Level: <span className="font-bold text-gray-300">{level}</span></div>
                <Button onClick={handleStart} size="lg" className="mt-4 bg-gray-600 hover:bg-gray-500 text-white">Play Again</Button>
            </div>
        )}
        {(gameState === 'playing' || gameState === 'feedback') && trial && (
          <>
            <div className="w-full flex justify-between font-mono text-gray-200 px-4">
                <span>Trial: {trialCount}/{TRIALS_PER_ROUND}</span>
                <span>Level: {level}</span>
            </div>
            
            <p className="font-semibold text-lg h-12 text-center text-gray-200">
              Where did the 'ping' come from?
            </p>

            <div className="h-10">
                {feedback && (
                    feedback.correct ? 
                    <Check className="w-10 h-10 text-green-400 animate-in fade-in" /> :
                    <p className="text-red-400 animate-in fade-in">Incorrect</p>
                )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: difficultySettings[level as keyof typeof difficultySettings].positions }).map((_, i) => {
                  const positions = Array.from({ length: difficultySettings[level as keyof typeof difficultySettings].positions }, (_, i) => -1 + (i * (2 / (difficultySettings[level as keyof typeof difficultySettings].positions - 1))));
                  const pan = positions[i];
                  return (
                    <Button 
                        key={i}
                        onClick={() => handleResponse(pan)} 
                        disabled={gameState === 'feedback'}
                        className={cn(
                            "w-16 h-16 text-xl",
                            feedback && feedback.correctChoice === i && "bg-green-600",
                            feedback && feedback.userChoice === i && !feedback.correct && "bg-rose-600"
                        )}
                    >{i + 1}</Button>
                  )
              })}
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
