'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Loader2, Check, X, Code } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

// Types
type MiniGameType = 'debugging' | 'inference';
type Rule = 'ascending' | 'descending' | 'alternating' | 'every_third_high';
type Tone = { pitch: number, duration: number };

type DebuggingPuzzle = {
  type: 'debugging';
  reference: Tone[];
  buggy: Tone[];
  bugPosition: number; // 0-indexed
};

type InferencePuzzle = {
  type: 'inference';
  rule: Rule;
  examples: Tone[][];
  candidates: [Tone[], Tone[]];
  correctCandidateIndex: number;
};

type Puzzle = DebuggingPuzzle | InferencePuzzle;
const TRIALS_PER_ROUND = 20;
const MAX_LEVEL = 5;

// --- STIMULUS GENERATION ---
const pitchPalette = [60, 62, 64, 65, 67, 69, 71, 72]; // C4 to C5
const durations = { short: 100, long: 300 };

const generateSequence = (length: number, rule: Rule): Tone[] => {
    const seq: Tone[] = [];
    let lastPitchIndex = Math.floor(Math.random() * 4);
    for(let i=0; i<length; i++) {
        let pitchIndex, duration;
        switch(rule) {
            case 'ascending':
                pitchIndex = lastPitchIndex + 1;
                duration = durations.short;
                break;
            case 'descending':
                pitchIndex = lastPitchIndex - 1;
                duration = durations.short;
                break;
            case 'alternating':
                pitchIndex = lastPitchIndex;
                duration = i % 2 === 0 ? durations.short : durations.long;
                break;
            case 'every_third_high':
                pitchIndex = i % 3 === 2 ? 7 : 3;
                duration = durations.short;
                break;
        }
        pitchIndex = Math.max(0, Math.min(pitchPalette.length - 1, pitchIndex));
        seq.push({ pitch: pitchPalette[pitchIndex], duration });
        lastPitchIndex = pitchIndex;
    }
    return seq;
}


const generatePuzzle = (level: number, prevType: MiniGameType): Puzzle => {
    const type: MiniGameType = prevType === 'debugging' ? 'inference' : 'debugging';
    const sequenceLength = 4 + Math.floor((level - 1) * (4 / (MAX_LEVEL - 1)));
    
    if (type === 'debugging') {
        const rule: Rule = 'ascending'; // Simple rule for debugging task
        const reference = generateSequence(sequenceLength, rule);
        const buggy = [...reference];
        const bugPosition = Math.floor(Math.random() * sequenceLength);
        const originalTone = buggy[bugPosition];
        buggy[bugPosition] = { ...originalTone, pitch: originalTone.pitch + (Math.random() > 0.5 ? 2 : -2) };
        return { type: 'debugging', reference, buggy, bugPosition };
    } else { // inference
        const rules: Rule[] = ['ascending', 'descending', 'alternating', 'every_third_high'];
        const rule = rules[Math.floor(Math.random() * rules.length)];
        const examples = [generateSequence(sequenceLength, rule), generateSequence(sequenceLength, rule), generateSequence(sequenceLength, rule)];
        const validCandidate = generateSequence(sequenceLength, rule);
        let invalidCandidate: Tone[];
        do {
            const otherRule = rules.find(r => r !== rule)!;
            invalidCandidate = generateSequence(sequenceLength, otherRule);
        } while (JSON.stringify(invalidCandidate) === JSON.stringify(validCandidate));
        
        const candidates: [Tone[], Tone[]] = Math.random() > 0.5 ? [validCandidate, invalidCandidate] : [invalidCandidate, validCandidate];
        const correctCandidateIndex = candidates[0] === validCandidate ? 0 : 1;

        return { type: 'inference', rule, examples, candidates, correctCandidateIndex };
    }
}


export function CodeLogicMode() {
  const { engine } = useAudioEngine();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'feedback' | 'summary'>('idle');
  const [level, setLevel] = useState(1);
  const [trialCount, setTrialCount] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean, userChoice?: any, correctChoice?: any, show: boolean }>({ correct: false, show: false });
  const [replaysLeft, setReplaysLeft] = useState(1);
  const correctStreak = useRef(0);

  const playSequence = useCallback((sequence: Tone[]) => {
      if(!engine) return;
      sequence.forEach((tone, index) => {
          engine.playTone({
              frequency: tone.pitch,
              duration: tone.duration / 1000,
              delay: index * 0.2, // Fixed ISI for simplicity
              type: 'square',
              volume: 0.3
          });
      });
  }, [engine]);

  const startNextTrial = useCallback(() => {
    if (trialCount >= TRIALS_PER_ROUND) {
      setGameState('summary');
      return;
    }
    const newPuzzle = generatePuzzle(level, puzzle?.type ?? 'inference');
    setPuzzle(newPuzzle);
    setTrialCount(c => c + 1);
    setReplaysLeft(1);
    setFeedback({ correct: false, show: false });
    setGameState('playing');
  }, [level, trialCount, puzzle]);
  
  useEffect(() => {
    if (gameState === 'playing' && puzzle) {
        if(puzzle.type === 'debugging') {
            playSequence(puzzle.reference);
            setTimeout(() => playSequence(puzzle.buggy), (puzzle.reference.length * 200) + 1000);
        } else { // inference
            playSequence(puzzle.examples[0]);
             setTimeout(() => playSequence(puzzle.examples[1]), (puzzle.examples[0].length * 200) + 500);
             setTimeout(() => playSequence(puzzle.examples[2]), (puzzle.examples[0].length * 200) * 2 + 1000);
        }
    }
  }, [gameState, puzzle, playSequence]);

  const handleStart = () => {
    engine?.resumeContext();
    setLevel(1);
    setTrialCount(0);
    setScore(0);
    correctStreak.current = 0;
    startNextTrial();
  };

  const handleReplay = () => {
    if (replaysLeft > 0 && gameState === 'playing' && puzzle) {
        setReplaysLeft(r => r-1);
        if(puzzle.type === 'debugging') {
             playSequence(puzzle.reference);
            setTimeout(() => playSequence(puzzle.buggy), (puzzle.reference.length * 200) + 1000);
        } else {
             playSequence(puzzle.candidates[0]);
             setTimeout(() => playSequence(puzzle.candidates[1]), (puzzle.candidates[0].length * 200) + 500);
        }
    }
  }
  
  const handleInferencePlay = () => {
      if(!puzzle || puzzle.type !== 'inference') return;
      playSequence(puzzle.candidates[0]);
      setTimeout(() => playSequence(puzzle.candidates[1]), (puzzle.candidates[0].length * 200) + 500);
  }

  const handleResponse = (userAnswer: number) => {
    if (gameState !== 'playing' || !puzzle) return;

    let isCorrect = false;
    if (puzzle.type === 'debugging') {
        isCorrect = userAnswer === puzzle.bugPosition;
    } else { // inference
        isCorrect = userAnswer === puzzle.correctCandidateIndex;
    }
    
    setGameState('feedback');
    setFeedback({ correct: isCorrect, userChoice: userAnswer, correctChoice: puzzle.type === 'debugging' ? puzzle.bugPosition : puzzle.correctCandidateIndex, show: true });
    
    if(isCorrect) {
        setScore(s => s + 1);
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
    <Card className="w-full max-w-2xl text-center bg-gray-900 border-gray-500/30 text-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-gray-300">
          <span className="p-2 bg-gray-500/10 rounded-md"><Code className="w-6 h-6 text-gray-400" /></span>
          Auditory Pattern Compiler
        </CardTitle>
        <CardDescription className="text-gray-300/70">Listen to the "code" sequences and identify bugs or infer the underlying logic.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
        {gameState === 'idle' && <Button onClick={handleStart} size="lg" className="bg-gray-600 hover:bg-gray-500 text-white">Start</Button>}
        {gameState === 'summary' && (
            <div className="flex flex-col items-center gap-4 text-gray-200">
                <CardTitle>Round Complete!</CardTitle>
                <div className="text-lg">Final Score: <span className="font-bold text-gray-300">{score} / {TRIALS_PER_ROUND}</span></div>
                <div className="text-lg">Peak Level: <span className="font-bold text-gray-300">{level}</span></div>
                <Button onClick={handleStart} size="lg" className="mt-4 bg-gray-600 hover:bg-gray-500 text-white">Play Again</Button>
            </div>
        )}
        {(gameState === 'playing' || gameState === 'feedback') && puzzle && (
          <>
            <div className="w-full flex justify-between font-mono text-gray-200 px-4">
                <span>Trial: {trialCount}/{TRIALS_PER_ROUND}</span>
                <span>Level: {level}</span>
            </div>
            
            <p className="font-semibold text-lg h-12 text-center text-gray-200">
              {puzzle.type === 'debugging' ? 'Find the auditory bug.' : 'Which candidate pattern follows the rule demonstrated by the examples?'}
            </p>
            
            {puzzle.type === 'inference' && (
                <Button onClick={handleInferencePlay} disabled={gameState === 'feedback'}>Play Candidates</Button>
            )}

            <div className="h-10">
                {feedback.show && (
                    feedback.correct ? 
                    <Check className="w-10 h-10 text-green-400 animate-in fade-in" /> : 
                    <X className="w-10 h-10 text-rose-400 animate-in fade-in" />
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {puzzle.type === 'debugging' ? (
                Array.from({ length: puzzle.reference.length }).map((_, i) => (
                  <Button 
                    key={i}
                    onClick={() => handleResponse(i)} 
                    disabled={gameState === 'feedback'} 
                    className={cn(
                        "w-16 h-16 text-xl",
                        feedback.show && feedback.correctChoice === i && "bg-green-600",
                        feedback.show && feedback.userChoice === i && !feedback.correct && "bg-rose-600"
                    )}
                  >{i + 1}</Button>
                ))
              ) : (
                <>
                  <Button 
                    onClick={() => handleResponse(0)} 
                    disabled={gameState === 'feedback'} 
                    className={cn("h-24 text-2xl", feedback.show && feedback.correctChoice === 0 && "bg-green-600", feedback.show && feedback.userChoice === 0 && !feedback.correct && "bg-rose-600")}
                  >Pattern 1</Button>
                  <Button 
                    onClick={() => handleResponse(1)} 
                    disabled={gameState === 'feedback'} 
                    className={cn("h-24 text-2xl", feedback.show && feedback.correctChoice === 1 && "bg-green-600", feedback.show && feedback.userChoice === 1 && !feedback.correct && "bg-rose-600")}
                  >Pattern 2</Button>
                </>
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
