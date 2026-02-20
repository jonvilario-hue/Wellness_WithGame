
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Puzzle, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { wordParts } from '@/data/verbal-content';

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Puzzle Generation ---
type WordPuzzle = {
  parts: string[];
  answer: string;
  options: string[];
  hint: string;
};

// NOTE: This generator is a simplified placeholder based on the verbal spec.
// A real implementation would use a larger word corpus.
const generatePuzzleForLevel = (level: number, focus: TrainingFocus): WordPuzzle => {
  const { content_config } = policy.levelMap[level] || policy.levelMap[1];
  const params = content_config[focus]?.params || content_config['neutral']!.params;
  
  let parts: string[];
  let answer: string;
  let hint: string;

  if (params.type === 'compound') {
    const word = wordParts.compound_words[Math.floor(Math.random() * wordParts.compound_words.length)];
    parts = word.parts;
    answer = word.answer;
    hint = word.hint;
  } else { // affixes
    const word = wordParts.affix_words[Math.floor(Math.random() * wordParts.affix_words.length)];
    parts = word.parts;
    answer = word.answer;
    hint = word.hint;
  }

  const options: string[] = [answer];
  const decoy1 = [...parts].reverse().join('');
  if (decoy1 !== answer && !options.includes(decoy1)) options.push(decoy1);
  while(options.length < 4) {
      const shuffled = [...parts].sort(() => 0.5 - Math.random()).join('');
      if(shuffled !== answer && !options.includes(shuffled)) {
          options.push(shuffled);
      }
  }
  
  return {
    parts: parts.sort(() => Math.random() - 0.5),
    answer,
    options: options.sort(() => Math.random() - 0.5),
    hint,
  };
};

const WordPart = ({ part }: { part: string }) => {
    const [rotation] = useState(Math.random() * 40 - 20);
    return (
        <div 
            className="p-3 border-2 border-dashed border-primary/50 bg-muted rounded-md font-mono text-2xl text-primary font-bold shadow-sm"
            style={{ transform: `rotate(${rotation}deg)`}}
        >
            {part}
        </div>
    )
}

export function OrthographicConstruction({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  const [puzzle, setPuzzle] = useState<WordPuzzle | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    setPuzzle(generatePuzzleForLevel(loadedLevel, focus));
    setSelectedOption(null);
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, [focus]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);

  const handleSelectOption = (option: string) => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
    setGameState('feedback');
    setSelectedOption(option);
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = option === puzzle.answer;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gv') : getFailureFeedback('Gv'), type: isCorrect ? 'success' : 'failure' });

    setTimeout(() => {
      currentTrialIndex.current++;
      if (currentTrialIndex.current >= policy.sessionLength) {
        setGameState('finished');
        const finalState = endSession(newState, [...sessionTrials, trialResult]);
        updateAdaptiveState(GAME_ID, finalState);
      } else {
        startNewTrial(newState);
      }
    }, 2000);
  };

  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
          <Button onClick={startNewSession} size="lg">Start Session</Button>
        </div>
      );
    }
    if (gameState === 'finished') {
      const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <CardTitle>Session Complete!</CardTitle>
          <p>Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0)}%</p>
          <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
        </div>
      );
    }
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState.currentLevel}</span>
        </div>
        
        <p className="text-center text-muted-foreground italic">Hint: "{puzzle.hint}"</p>

        <div className="relative w-full h-40 p-4 bg-muted/30 rounded-lg flex items-center justify-center gap-4">
          {puzzle.parts.map(part => <WordPart key={part} part={part} />)}
        </div>
        
        <div className="h-6 text-sm font-semibold">
          {inlineFeedback.message && (
            <p className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
              {inlineFeedback.message}
            </p>
          )}
        </div>

        <div className="w-full">
          <h3 className="text-center font-semibold mb-3">Assemble the word:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {puzzle.options.map((option, index) => (
              <Button
                key={index} 
                onClick={() => handleSelectOption(option)}
                className={cn(
                  "h-16 text-lg transition-all",
                  gameState === 'feedback' && option === puzzle.answer && "bg-green-600 hover:bg-green-700",
                  gameState === 'feedback' && selectedOption === option && option !== puzzle.answer && "bg-destructive hover:bg-destructive/90"
                )}
                disabled={gameState === 'feedback'}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
            <Puzzle />
            (Gv) Orthographic Construction
        </CardTitle>
        <CardDescription>Mentally assemble the word fragments to match the definition.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
