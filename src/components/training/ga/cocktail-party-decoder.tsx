
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Ear, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { minimalPairs, prosodySentences } from '@/data/verbal-content';
import type { TrainingFocus } from '@/types';

// This component simulates the "Cocktail Party Decoder" task for Gc.
// Ga tasks (like stream segregation) would need a more complex audio engine.

type Puzzle = {
  type: 'minimal_pair' | 'prosody';
  prompt: string;
  stimulus: string; // The word/sentence to be identified
  options: string[];
  answer: string;
};

const generatePuzzle = (level: number): Puzzle => {
  // At level 10+, the original spec called for sarcasm detection.
  // This is a Gc (pragmatic inference) task, not a Ga (auditory processing) task.
  // High-level Ga would be stream segregation or fine-grained phoneme discrimination in heavy noise.
  // We will keep this Gc-flavored task here as a stand-in for a pure Ga high-level task.
  const isProsody = level > 5 && Math.random() > 0.5;
  
  if (isProsody) {
    const puzzleData = prosodySentences[Math.floor(Math.random() * prosodySentences.length)];
    return {
      type: 'prosody',
      prompt: 'What was the emotional tone of the speaker?',
      stimulus: puzzleData.sentence,
      options: puzzleData.options,
      answer: puzzleData.answer,
    };
  } else {
    const puzzleData = minimalPairs[Math.floor(Math.random() * minimalPairs.length)];
    return {
      type: 'minimal_pair',
      prompt: puzzleData.prompt,
      stimulus: puzzleData.correct,
      options: [puzzleData.word1, puzzleData.word2],
      answer: puzzleData.correct,
    };
  }
};

// Visual representation of noise
const NoiseOverlay = ({ level }: { level: number }) => {
    const noiseDensity = Math.min(0.5, level / 40);
    const chars = '`^~*·';
    const noiseString = Array.from({ length: 50 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none" aria-hidden="true">
            <span className="font-mono text-muted-foreground/50 text-3xl" style={{ opacity: noiseDensity }}>
                {noiseString}
            </span>
        </div>
    );
};

export function CocktailPartyDecoder({ onComplete, level }: { onComplete: (result: { score: number }) => void; level: number }) {
  const [gameState, setGameState] = useState<'loading' | 'playing' | 'feedback' | 'finished'>('loading');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [score, setScore] = useState(0);
  const [trial, setTrial] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const trialsPerSession = 10; // Fixed number of trials for this module

  const startNewTrial = useCallback(() => {
    if (trial >= trialsPerSession) {
      setGameState('finished');
      onComplete({ score });
      return;
    }
    setFeedback(null);
    setSelected(null);
    setPuzzle(generatePuzzle(level));
    setGameState('playing');
  }, [level, trial, onComplete, score]);

  useEffect(() => {
    startNewTrial();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleAnswer = (answer: string) => {
    if (gameState !== 'playing' || !puzzle) return;

    setGameState('feedback');
    setSelected(answer);
    const isCorrect = answer === puzzle.answer;

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }

    setTimeout(() => {
      setTrial(t => t + 1);
    }, 2000);
  };
  
  useEffect(() => {
    if(gameState === 'feedback') {
       const timer = setTimeout(() => {
         startNewTrial();
       }, 2000);
       return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial]);


  if (gameState === 'loading' || !puzzle) {
    return <Loader2 className="w-12 h-12 animate-spin text-primary" />;
  }

  if (gameState === 'finished') {
    return <div className="text-xl font-bold">Mode Complete! Score: {score}/{trialsPerSession}</div>;
  }
  
  return (
    <div className="w-full max-w-md text-center space-y-6">
      <div className="flex justify-between w-full font-mono text-sm">
        <span>Trial: {trial + 1} / {trialsPerSession}</span>
        <span>Score: {score}</span>
      </div>
      
      <p className="font-semibold text-lg">{puzzle.prompt}</p>

      <div className="relative p-8 bg-muted/50 rounded-lg min-h-[100px] flex items-center justify-center">
        <NoiseOverlay level={level} />
        <p className="text-3xl font-bold text-foreground relative">{puzzle.stimulus}</p>
        <div className="absolute -top-3 -left-3 p-2 bg-background rounded-full border">
             <Ear className="w-5 h-5 text-primary"/>
        </div>
      </div>

       <div className="h-10 flex items-center justify-center">
        {feedback === 'correct' && <p className="text-green-500 font-bold text-2xl flex items-center gap-2"><Check /> Correct!</p>}
        {feedback === 'incorrect' && <p className="text-destructive font-bold text-2xl flex items-center gap-2"><X /> Incorrect. Answer: {puzzle.answer}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {puzzle.options.map(option => (
          <Button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={gameState === 'feedback'}
            size="lg"
            className={cn("h-20 text-xl",
                gameState === 'feedback' && option === puzzle.answer && "bg-green-600 hover:bg-green-700",
                gameState === 'feedback' && selected === option && option !== puzzle.answer && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
