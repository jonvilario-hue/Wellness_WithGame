'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Brain, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

// --- DATA: Scenarios & Emotion Regulation Strategies ---
const regulationScenarios = [
  {
    scenario: "You receive an unexpectedly harsh critique of your work from a respected colleague in front of the team.",
    options: [
      { text: "Publicly argue back to defend your work's quality.", strategy: "Response Modulation (Suppression - Ineffective)" },
      { text: "Silently remind yourself: 'This feedback is about the work, not me. It's a chance to improve.'", strategy: "Cognitive Reappraisal" },
      { text: "Avoid the colleague for the rest of the week.", strategy: "Situation Selection (Avoidance)" },
      { text: "Ruminate on the comment all day, feeling embarrassed.", strategy: "Rumination (Maladaptive)" },
    ],
    answer: "Silently remind yourself: 'This feedback is about the work, not me. It's a chance to improve.'",
    explanation: "Cognitive Reappraisal is highly effective. It changes how you interpret the situation to alter its emotional impact without avoiding the issue."
  },
  {
    scenario: "You are feeling intense anxiety about a major presentation tomorrow morning.",
    options: [
      { text: "Watch a funny movie to take your mind off it for a while.", strategy: "Attentional Deployment (Distraction)" },
      { text: "Cancel the presentation.", strategy: "Situation Selection (Avoidance)" },
      { text: "Tell yourself 'I'm not anxious, I'm excited!'", strategy: "Cognitive Reappraisal" },
      { text: "Stay up all night over-preparing and worrying.", strategy: "Rumination (Maladaptive)" },
    ],
    answer: "Watch a funny movie to take your mind off it for a while.",
    explanation: "Attentional Deployment (Distraction) is a valid short-term strategy to reduce acute anxiety and prevent unhelpful rumination the night before an event."
  }
  // More scenarios would be added here
];

export function RegulationArchitect({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [puzzle, setPuzzle] = useState<(typeof regulationScenarios)[0] | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    setPuzzle(regulationScenarios[Math.floor(Math.random() * regulationScenarios.length)]);
    setSelectedAnswer(null);
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);

  const handleAnswer = (option: string) => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;

    setGameState('feedback');
    setSelectedAnswer(option);
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = option === puzzle.answer;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gc') : getFailureFeedback('Gc'), type: isCorrect ? 'success' : 'failure' });
    
    setTimeout(() => {
        currentTrialIndex.current++;
        if (currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(finalState);
        } else {
            startNewTrial(newState);
        }
    }, 3500); // Longer delay to read explanation
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
        <div className="text-center space-y-4 animate-in fade-in">
          <CardTitle>Session Complete!</CardTitle>
          <p className="text-xl">Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0) + '%'}</p>
          <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
        </div>
      );
    }

    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

    return (
      <>
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState?.currentLevel}</span>
        </div>
        <div className="p-6 bg-muted rounded-lg w-full text-center min-h-[100px] flex items-center justify-center">
          <p className="text-lg font-medium">{puzzle.scenario}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {puzzle.options.map((option, index) => (
            <Button 
              key={index} 
              onClick={() => handleAnswer(option.text)}
              disabled={gameState === 'feedback'}
              size="lg"
              variant="outline"
              className={cn(
                  "h-auto py-3 whitespace-normal text-left justify-start transition-all duration-300",
                  gameState === 'feedback' && option.text === puzzle.answer && "bg-green-100 dark:bg-green-900/30 border-green-500",
                  gameState === 'feedback' && selectedAnswer === option.text && option.text !== puzzle.answer && "bg-destructive/10 border-destructive",
              )}
            >
              {option.text}
            </Button>
          ))}
        </div>
        <div className="h-20 mt-2 text-center">
          {gameState === 'feedback' && (
            <div className="animate-in fade-in space-y-2">
                <p className={cn("font-semibold", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
                    {inlineFeedback.message}
                </p>
                <p className="text-sm text-muted-foreground">{puzzle.explanation}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <Brain />
            (Gc) Regulation Architect
        </CardTitle>
        <CardDescription className="text-center">
          Apply your knowledge of emotion regulation to choose the most effective strategy for the given scenario.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
