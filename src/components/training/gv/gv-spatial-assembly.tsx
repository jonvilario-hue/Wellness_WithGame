
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Puzzle, Loader2 } from 'lucide-react';
import type { TrainingFocus, TrialResult, AdaptiveState, GameId } from "@/types";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

const PUZZLE_BANK = [
  // Tier 1: Simple Assembly, No Rotation
  { tier: 1, fragments: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z", t: "translate(0, 0)" }, { d: "M 100 0 L 200 0 L 200 100 L 100 100 Z", t: "translate(10, 0)" }], solution: { d: "M 0 0 L 200 0 L 200 100 L 0 100 Z" }, distractors: [{ d: "M 0 0 L 150 0 L 150 100 L 0 100 Z" }, { d: "M 0 0 L 200 0 L 200 80 L 0 80 Z" }] },
  { tier: 1, fragments: [{ d: "M 0 0 L 100 100 L 0 100 Z", t: "translate(0, 0)" }, { d: "M 0 0 L 100 0 L 100 100 Z", t: "translate(10, 0)" }], solution: { d: "M 0 0 L 100 0 L 100 100 L 0 100 Z" }, distractors: [{ d: "M 0 0 L 100 50 L 0 100 Z" }, { d: "M 0 0 L 100 0 L 50 100 Z" }] },
  { tier: 1, fragments: [{ d: "M 50 0 A 50 50 0 0 1 50 100", t: "translate(0, 0)" }, { d: "M 50 0 A 50 50 0 0 0 50 100", t: "translate(10, 0)" }], solution: { d: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0" }, distractors: [{ d: "M 50 0 A 40 50 0 1 1 50 100 A 40 50 0 1 1 50 0" }, { d: "M 50 0 L 100 50 L 50 100 L 0 50 Z" }] },
  { tier: 1, fragments: [{ d: "M 0 50 L 100 50 L 100 100 L 0 100 Z", t: "translate(0, 0)"}, { d: "M 50 0 L 100 50 L 0 50 Z", t: "translate(0, -10)"}], solution: { d: "M 50 0 L 100 50 L 100 100 L 0 100 L 0 50 Z" }, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z" }, {d: "M 50 0 L 100 100 L 0 100 Z"}] },
  { tier: 1, fragments: [{ d: "M 0 0 L 50 0 L 50 100 L 0 100 Z", t: "translate(0,0)"}, {d: "M 50 0 L 100 0 L 100 50 L 50 50 Z", t: "translate(0, 10)"}], solution: { d: "M 0 0 L 100 0 L 100 50 L 50 50 L 50 100 L 0 100 Z" }, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z" }, {d: "M 0 0 L 50 0 L 50 50 L 100 50 L 100 100 L 0 100 Z" }] },
  // Tier 2: Rotation
  { tier: 2, fragments: [{ d: "M 0 0 L 100 0 L 100 50 Z", t: "translate(0,0) rotate(0)" }, { d: "M 0 0 L 100 50 L 0 50 Z", t: "translate(10, 10) rotate(180 50 25)"}], solution: { d: "M 0 0 L 100 0 L 0 50 Z" }, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z"}, {d: "M 0 0 L 100 50 L 0 50 Z"}]},
  { tier: 2, fragments: [{ d: "M 0 0 L 100 0 L 100 25 L 0 25 Z", t: "translate(0,0) rotate(0)"}, { d: "M 0 0 L 25 0 L 25 100 L 0 100 Z", t: "translate(37.5, -37.5) rotate(90 12.5 50)"}], solution: { d: "M 0 0 L 100 0 L 100 25 L 25 25 L 25 100 L 0 100 Z"}, distractors: [{d: "M 0 0 L 100 0 L 100 100 L 0 100 Z"}, {d: "M 0 0 L 25 0 L 25 75 L 100 75 L 100 100 L 0 100 Z"}]},
  { tier: 2, fragments: [{d: "M 0 0 L 50 0 L 50 50 L 0 50 Z", t: "translate(0,0)"}, {d: "M 0 0 L 50 0 L 50 50 L 0 50 Z", t: "translate(50, 50)"}, {d: "M 0 0 L 50 0 L 50 50 L 0 50 Z", t: "translate(10,10) rotate(45 25 25)"}], solution: { d: "M 0 0 L 50 0 L 100 50 L 100 100 L 50 100 L 0 50 Z" }, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z"}, {d: "M 0 50 L 50 0 L 100 50 L 50 100 Z"}]},
  { tier: 2, fragments: [{d: "M 0 0 L 100 0 L 50 50 Z", t: "translate(0,0)"}, {d: "M 50 50 L 100 100 L 0 100 Z", t: "translate(0, 10) rotate(180 50 75)"}], solution: { d: "M 0 0 L 100 0 L 100 100 L 0 100 Z" }, distractors: [{ d: "M 0 0 L 100 0 L 50 100 L 0 100 Z" }, {d: "M 0 0 L 100 0 L 100 50 L 50 50 L 50 100 L 0 100 Z"}]},
  { tier: 2, fragments: [{d: "M 25 0 L 75 0 L 75 100 L 25 100 Z", t: "translate(0,0)"}, {d: "M 0 25 L 100 25 L 100 75 L 0 75 Z", t: "translate(0, 10) rotate(90 50 50)"}], solution: { d: "M 25 0 L 75 0 L 75 25 L 100 25 L 100 75 L 75 75 L 75 100 L 25 100 L 25 75 L 0 75 L 0 25 L 25 25 Z"}, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z" }, {d: "M 25 25 L 75 25 L 75 75 L 25 75 Z" }]},
  // Tier 3: Multiple Fragments, Rotation, Overlap
  { tier: 3, fragments: [{d: "M 0 0 L 50 0 L 25 50 Z", t: "translate(0,0)"}, {d: "M 25 50 L 75 50 L 50 100 Z", t: "translate(0, 10)"}, {d: "M 25 50 L -25 50 L 0 100 Z", t: "translate(100, 10) rotate(180 25 75)"}], solution: { d: "M 25 0 L 75 0 L 100 50 L 75 100 L 25 100 L 0 50 Z" }, distractors: [{d: "M 0 0 L 100 0 L 100 100 L 0 100 Z"}, { d: "M 50 0 L 100 50 L 50 100 L 0 50 Z"}]},
  { tier: 3, fragments: [{d: "M 0 50 L 50 0 L 100 50 Z", t: "translate(0,0)"}, {d: "M 0 50 L 50 100 L 100 50 Z", t: "translate(0,10)"}], solution: { d: "M 0 50 L 50 0 L 100 50 L 50 100 Z" }, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z" }, {d: "M 50 0 L 100 100 L 0 100 Z"}]},
  { tier: 3, fragments: [{d: "M 0 0 L 50 0 L 50 50 L 0 50 Z", t: "translate(0,0)"}, {d: "M 0 0 L 50 0 L 25 25 Z", t: "translate(50, 0) rotate(90 25 25)"}, {d: "M 0 0 L 50 0 L 25 25 Z", t: "translate(0, 50) rotate(-90 25 25)"}, {d: "M 0 0 L 50 0 L 25 25 Z", t: "translate(50, 50) rotate(180 25 25)"}], solution: {d: "M 25 0 L 75 0 L 100 25 L 100 75 L 75 100 L 25 100 L 0 75 L 0 25 Z"}, distractors: [{d: "M 0 0 L 100 0 L 100 100 L 0 100 Z"}, {d: "M 50 0 L 100 50 L 50 100 L 0 50 Z"}]},
  { tier: 3, fragments: [{d: "M 0 25 L 50 0 L 100 25 L 50 50 Z", t: "translate(0,0)"}, {d: "M 0 25 L 50 50 L 100 25 L 50 100 Z", t: "translate(0, 10)"}], solution: {d: "M 50 0 L 100 25 L 100 75 L 50 100 L 0 75 L 0 25 Z"}, distractors: [{d: "M 0 0 L 100 0 L 100 100 L 0 100 Z"}, {d: "M 50 0 L 100 50 L 50 100 L 0 50 Z"}]},
  { tier: 3, fragments: [{d: "M 50 0 L 60 40 L 100 40 L 65 65 L 80 100 L 50 80 L 20 100 L 35 65 L 0 40 L 40 40 Z", t: "translate(0,0)"}], solution: {d: "M 50 0 L 60 40 L 100 40 L 65 65 L 80 100 L 50 80 L 20 100 L 35 65 L 0 40 L 40 40 Z"}, distractors: [{d: "M 50 0 L 100 100 L 0 100 Z"}, {d: "M 50 0 L 100 50 L 50 100 L 0 50 Z"}]},
];

// --- Fisher-Yates Shuffle ---
const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export function GvSpatialAssembly({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any | null>(null);
  const trialStartTime = useRef(0);
  
  const puzzle = useMemo(() => {
    if (!adaptiveState) return null;
    const level = adaptiveState.currentLevel;
    
    const policyForLevel = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const policyTier = policyForLevel?.content_config?.[focus]?.params?.puzzle_tier || 1;

    const puzzlesInTier = PUZZLE_BANK.filter(p => p.tier === policyTier);
    if (puzzlesInTier.length === 0) {
      const fallbackPuzzles = PUZZLE_BANK.filter(p => p.tier === 1);
      return fallbackPuzzles[currentTrialIndex % fallbackPuzzles.length];
    }
    
    return puzzlesInTier[currentTrialIndex % puzzlesInTier.length];
  }, [adaptiveState, currentTrialIndex, focus]);

  const answerOptions = useMemo(() => puzzle ? shuffle([puzzle.solution, ...puzzle.distractors]) : [], [puzzle]);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setCurrentTrialIndex(0);
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, [adaptiveState]);

  const handleAnswer = (option: { d: string }) => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
    
    const levelPlayed = adaptiveState.currentLevel;
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = option.d === puzzle.solution.d;

    const trialResult: TrialResult = {
        correct: isCorrect,
        reactionTimeMs,
        telemetry: {
            puzzleTier: puzzle.tier,
            pieceCount: puzzle.fragments.length,
            rotationRequired: puzzle.fragments.some(f => f.t.includes('rotate')),
            completionTime_ms: reactionTimeMs,
            errorMargin_px: 0, // Not applicable for this task version
        }
    };

    logTrial({
      userId: 'local_user',
      module_id: GAME_ID,
      currentLevel: levelPlayed,
      isCorrect,
      responseTime_ms: reactionTimeMs,
      meta: trialResult.telemetry
    });

    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    updateAdaptiveState(GAME_ID, focus, newState);
    setAdaptiveState(newState);
    
    setSelectedAnswer(option);
    setGameState('feedback');

    setTimeout(() => {
      const nextTrialIndex = currentTrialIndex + 1;
      if (nextTrialIndex >= policy.sessionLength) {
        setGameState('finished');
      } else {
        setCurrentTrialIndex(nextTrialIndex);
        setSelectedAnswer(null);
        setGameState('playing');
        trialStartTime.current = Date.now();
      }
    }, 2000);
  };
  
  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-lime-400" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <Button onClick={startNewSession} size="lg" variant="outline" className="border-lime-400 text-lime-400 hover:bg-lime-400/10 hover:text-lime-300">Start Assembly</Button>
        </div>
      );
    }
    
    if (gameState === 'finished') {
      const sessionTrials = getAdaptiveState(GAME_ID, focus).recentTrials.slice(-policy.sessionLength);
      const score = sessionTrials.filter(r => r.correct).length;
      return (
        <div className="text-center space-y-4">
          <CardTitle>Session Complete!</CardTitle>
          <p>Score: {score} / {policy.sessionLength}</p>
          <Button onClick={startNewSession} size="lg" variant="outline" className="border-lime-400 text-lime-400 hover:bg-lime-400/10 hover:text-lime-300">Play Again</Button>
        </div>
      );
    }
    
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-lime-400" />;

    return (
      <div className="w-full flex flex-col items-center gap-6">
        <div className="w-full flex justify-between font-mono text-sm text-gray-300">
          <span>Puzzle: {currentTrialIndex + 1} / {policy.sessionLength}</span>
          <span>Tier: {puzzle.tier}</span>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full items-center">
          {/* Fragments */}
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-semibold text-gray-400">Fragments</h3>
            <div className="w-48 h-48 bg-gray-900/70 rounded-lg border border-lime-500/30 p-4 relative">
              <div className="grid grid-cols-2 gap-2">
                {puzzle.fragments.map((frag, i) => (
                  <svg key={i} viewBox="0 0 110 110" className="w-16 h-16">
                    <path d={frag.d} transform={frag.t} fill="none" stroke="hsl(var(--primary))" strokeWidth="8" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
          {/* Answer Options */}
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-semibold text-gray-400">Assemble into...</h3>
            <div className="grid grid-cols-1 gap-3">
              {answerOptions.map((opt, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className={cn(
                    "h-24 w-40 p-2 bg-gray-900 border-lime-400/30 hover:bg-lime-900/50",
                    gameState === 'feedback' && opt.d === puzzle.solution.d && "bg-green-500/30 border-green-400",
                    gameState === 'feedback' && selectedAnswer?.d === opt.d && opt.d !== puzzle.solution.d && "bg-rose-500/30 border-rose-500",
                    selectedAnswer?.d === opt.d && gameState !== 'feedback' && "bg-lime-900/50 ring-2 ring-lime-400"
                  )}
                  onClick={() => handleAnswer(opt)}
                  disabled={gameState === 'feedback'}
                >
                  <svg viewBox="-10 -10 120 120" className="w-full h-full">
                    <path d={opt.d} fill="hsl(var(--primary) / 0.5)" stroke="hsl(var(--primary))" strokeWidth="5" />
                  </svg>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl bg-gray-950 border-lime-500/20 text-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-lime-300">
          <Puzzle /> (Gv) Spatial Assembly
        </CardTitle>
        <CardDescription className="text-lime-300/70">Mentally rotate and combine the fragments to form the correct final shape.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
