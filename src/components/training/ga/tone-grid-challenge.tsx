
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

type GameMode = 'mimic' | 'find';

export function ToneGridChallenge() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [gameState, setGameState] = useState('idle'); // idle, playing, answering, feedback, finished
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [message, setMessage] = useState('');
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  const [gameMode, setGameMode] = useState<GameMode>('mimic');
  const [targetTone, setTargetTone] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(0);

  const { logGameResult } = usePerformanceStore();
  const currentMode = 'neutral';

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContext) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
    }
    return () => {
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTone = (freq: number, duration = 0.3) => {
    if (!audioContext || audioContext.state === 'closed') return;
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  };
  
  const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

  const generateSequence = (currentLevel: number) => {
    const newSequence = [];
    const seqLength = gameMode === 'mimic' ? currentLevel + 2 : 5;
    for (let i = 0; i < seqLength; i++) {
      newSequence.push(Math.floor(Math.random() * frequencies.length));
    }
    setSequence(newSequence);
    return newSequence;
  };
  
  const playSequence = (seq: number[], interval = 400) => {
    if (!audioContext) return;
    seq.forEach((noteIndex, i) => {
      setTimeout(() => {
        playTone(frequencies[noteIndex]);
      }, i * interval);
    });
  };
  
  const startLevel = (currentLevel: number) => {
    if (lives <= 0) {
      setGameState('finished');
      const time = (Date.now() - startTime) / 1000;
      logGameResult('Ga', currentMode, { score, time });
      return;
    }
    
    setUserSequence([]);
    setInlineFeedback({ message: '', type: '' });
    const newMode = Math.random() > 0.3 ? 'mimic' : 'find';
    setGameMode(newMode);
    
    if (newMode === 'mimic') {
      setMessage('Listen carefully...');
      setGameState('playing');
      const newSeq = generateSequence(currentLevel);
      setTimeout(() => {
        playSequence(newSeq);
        setTimeout(() => {
          setMessage('Your turn: Repeat the sequence');
          setGameState('answering');
        }, newSeq.length * 400 + 500);
      }, 1000);
    } else { // find mode
      const newTarget = Math.floor(Math.random() * frequencies.length);
      setTargetTone(newTarget);
      setMessage('Listen for this target tone...');
      setGameState('playing');
      setTimeout(() => {
        playTone(frequencies[newTarget], 0.5);
        setTimeout(() => {
          setMessage('Now, was it in this sequence?');
          const newSeq = generateSequence(currentLevel);
          setTimeout(() => {
            playSequence(newSeq, 500);
            setTimeout(() => {
              setMessage('Was the target tone in the sequence?');
              setGameState('answering');
            }, newSeq.length * 500 + 500);
          }, 1000);
        }, 1000);
      }, 500);
    }
  };
  
  const handleStart = () => {
    if (audioContext?.state === 'suspended') {
        audioContext.resume();
    }
    setLevel(1);
    setScore(0);
    setLives(3);
    setStartTime(Date.now());
    startLevel(1);
  };
  
  const handleNextLevel = () => {
    setScore(prev => prev + (level * 10));
    const nextLevel = level + 1;
    setLevel(nextLevel);
    startLevel(nextLevel);
  };

  const handleIncorrect = () => {
    setLives(prev => prev - 1);
    setMessage(`Not quite. ${lives - 1} lives left. Let's try level ${level} again.`);
    setInlineFeedback({ message: getFailureFeedback('Ga'), type: 'failure' });
    setTimeout(() => {
        startLevel(level);
    }, 2000);
  };

  const handleUserInput = (index: number) => {
    if (gameState !== 'answering' || gameMode !== 'mimic') return;
    playTone(frequencies[index]);
    const newAttempt = [...userSequence, index];
    setUserSequence(newAttempt);
    
    if (newAttempt.length === sequence.length) {
      setGameState('feedback');
      if (JSON.stringify(newAttempt) === JSON.stringify(sequence)) {
        setInlineFeedback({ message: getSuccessFeedback('Ga'), type: 'success' });
        setMessage('Correct! Next level.');
        setTimeout(handleNextLevel, 1500);
      } else {
        setMessage('Incorrect. The correct sequence was...');
        setTimeout(() => {
            playSequence(sequence, 200);
            setTimeout(handleIncorrect, sequence.length * 200 + 500);
        }, 500);
      }
    }
  };
  
  const handleFindAnswer = (wasPresent: boolean) => {
    if (gameState !== 'answering' || gameMode !== 'find' || targetTone === null) return;
    setGameState('feedback');
    const isCorrect = sequence.includes(targetTone) === wasPresent;
    if (isCorrect) {
        setInlineFeedback({ message: getSuccessFeedback('Ga'), type: 'success' });
        setMessage('Correct! Next level.');
        setTimeout(handleNextLevel, 1500);
    } else {
        setMessage(sequence.includes(targetTone) ? 'Incorrect. The tone was there.' : 'Incorrect. The tone was not there.');
        setTimeout(handleIncorrect, 1500);
    }
  };

  if (gameState === 'finished') {
    return (
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle>Game Over</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-xl">Your final score is: <span className="font-bold text-primary">{score}</span></p>
          <Button onClick={handleStart} size="lg">Play Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl text-center">
      <CardHeader>
        <CardTitle>(Ga) Tone Grid Challenge</CardTitle>
        <CardDescription>Either repeat the sequence you hear, or identify if a target tone was present. This trains auditory discrimination and sequencing.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="w-full flex justify-between font-mono text-lg">
          <span>Level: {level}</span>
          <span>Score: {score}</span>
          <span>Lives: {lives}</span>
        </div>
        
        {gameState === 'idle' && <Button onClick={handleStart} size="lg">Start</Button>}
        
        {gameState !== 'idle' && (
          <div className="w-full">
            <p className="h-10 text-lg text-primary mb-2 flex items-center justify-center">{message}</p>
             <div className="h-6 text-sm font-semibold mb-2">
              {inlineFeedback.message && (
                <p className={cn(
                  "animate-in fade-in",
                  inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600'
                )}>
                  {inlineFeedback.message}
                </p>
              )}
            </div>
            {gameMode === 'mimic' && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {frequencies.map((_, index) => (
                    <Button 
                      key={index} 
                      onClick={() => handleUserInput(index)} 
                      disabled={gameState !== 'answering'}
                      className={cn(
                          "aspect-square h-auto text-2xl transition-all"
                      )}
                      variant="secondary"
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={() => playSequence(sequence)} 
                  disabled={gameState !== 'answering' || sequence.length === 0}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  <Volume2 className="mr-2"/>
                  Replay Sequence
                </Button>
              </>
            )}
            {gameMode === 'find' && gameState === 'answering' && (
              <div className="flex justify-center gap-4 animate-in fade-in">
                <Button onClick={() => handleFindAnswer(true)} size="lg">Yes</Button>
                <Button onClick={() => handleFindAnswer(false)} size="lg">No</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
