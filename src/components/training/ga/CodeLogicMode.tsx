
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAudioEngine, type ToneConfig } from "@/hooks/useAudioEngine";
import { Loader2, Check, X, Code, Volume2, HelpCircle } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";
import { PRNG } from '@/lib/rng';

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Type Definitions ---
type Gate = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR';
type TaskType = 'reproduction' | 'oddOneOut' | 'nBack';

interface GateConfig extends ToneConfig {
    name: Gate;
    color: string;
}

const gateToneMap: Record<Gate, GateConfig> = {
    'AND': { name: 'AND', frequency: 261.63, duration: 0.3, type: 'sine', color: '#a6e3a1' },
    'OR': { name: 'OR', frequency: 329.63, duration: 0.3, type: 'sine', color: '#89b4fa' },
    'NOT': { name: 'NOT', frequency: 392.00, duration: 0.3, type: 'square', color: '#f38ba8' },
    'XOR': { name: 'XOR', frequency: 523.25, duration: 0.3, type: 'triangle', color: '#f9e2af' },
    'NAND': { name: 'NAND', frequency: 261.63, duration: 0.3, type: 'square', color: '#94e2d5' },
    'NOR': { name: 'NOR', frequency: 329.63, duration: 0.3, type: 'square', color: '#cba6f7' },
};

type Trial = {
    taskType: TaskType;
    sequence: Gate[];
    answer: number[] | number; // sequence of indices for reproduction, single index for odd-one-out
    nBackMatches?: boolean[]; // for n-back
};

// --- Stimulus Generation ---
const generateGaTrial = (level: number, prng: PRNG, lastTask?: TaskType): Trial => {
    const params = policy.levelMap[level]?.content_config['logic']?.params;
    if (!params) throw new Error(`No logic params for Ga level ${level}`);

    const { gatePool, sequenceLength, taskMix, n_back } = params;
    
    let taskType: TaskType;
    const rand = prng.nextFloat();
    if (rand < taskMix[0]) taskType = 'reproduction';
    else if (rand < taskMix[0] + taskMix[1]) taskType = 'oddOneOut';
    else taskType = 'nBack';
    
    if (lastTask && taskType === lastTask && taskMix.filter((p: number) => p > 0).length > 1) {
        return generateGaTrial(level, prng, lastTask);
    }
    
    let sequence: Gate[] = [];
    let answer: number[] | number = [];
    let nBackMatches: boolean[] | undefined;

    switch (taskType) {
        case 'reproduction':
            sequence = Array.from({ length: sequenceLength }, () => prng.shuffle(gatePool)[0]);
            answer = sequence.map(gate => gatePool.indexOf(gate));
            break;
        case 'oddOneOut':
            const baseGate = prng.shuffle(gatePool)[0];
            sequence = Array(sequenceLength).fill(baseGate);
            const oddIndex = prng.nextIntRange(0, sequenceLength);
            let oddGate: Gate;
            do {
                oddGate = prng.shuffle(gatePool)[0];
            } while (oddGate === baseGate);
            sequence[oddIndex] = oddGate;
            answer = oddIndex;
            break;
        case 'nBack':
            nBackMatches = [];
            for (let i = 0; i < sequenceLength; i++) {
                const isMatch = i >= n_back && prng.nextFloat() < 0.3;
                nBackMatches.push(isMatch);
                let gate;
                if (isMatch) {
                    gate = sequence[i - n_back];
                } else {
                    do {
                        gate = prng.shuffle(gatePool)[0];
                    } while (i >= n_back && gate === sequence[i - n_back]);
                }
                sequence.push(gate);
            }
            break;
    }

    return { taskType, sequence, answer, nBackMatches };
};


// --- Main Component ---
export default function CodeLogicMode() {
  const { engine } = useAudioEngine();
  const [gameState, setGameState] = useState<'loading' | 'learn' | 'playing' | 'feedback' | 'summary'>('loading');
  const [trial, setTrial] = useState<Trial | null>(null);
  const [level, setLevel] = useState(1);
  const [userResponse, setUserResponse] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [trialCount, setTrialCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  const { getAdaptiveState } = usePerformanceStore();
  
  useEffect(() => {
    if (engine) {
        engine.resumeContext();
        setGameState('learn');
    }
    const adaptiveState = getAdaptiveState(GAME_ID, 'logic');
    setLevel(adaptiveState.currentLevel);
  }, [engine, getAdaptiveState]);

  const handleStartTrials = () => {
    setGameState('playing');
    // In a full implementation, this would trigger the first trial generation and playback
  };
  
  const currentGatePool = useMemo(() => {
      const params = policy.levelMap[level]?.content_config['logic']?.params;
      return params?.gatePool || [];
  }, [level]);

  // Simplified game loop for demonstration
  const handlePlay = () => {
      if (!engine || !trial) return;
      const tones = trial.sequence.map(gateName => gateToneMap[gateName]);
      const intervalMs = policy.levelMap[level]?.mechanic_config.intervalMs || 800;
      engine.playSequence(tones, intervalMs);
  };

  if(gameState === 'loading') return <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin" /><p>Initializing Audio...</p></div>;

  return (
    <Card className="w-full max-w-xl text-center bg-zinc-900 border-teal-500/20 text-teal-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-teal-300">
          <Code className="w-6 h-6" /> Logic Tone Sequences
        </CardTitle>
        <CardDescription className="text-teal-300/70">Listen to sequences of logic-gate tones and complete the auditory task.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
        {gameState === 'learn' && (
             <div className="flex flex-col items-center gap-4 w-full">
                <h3 className="text-xl font-semibold">Learn the Tones</h3>
                <p className="text-muted-foreground">Tap each gate to hear its unique sound.</p>
                <div className="grid grid-cols-3 gap-3">
                    {currentGatePool.map((gateName: Gate) => (
                        <Button
                            key={gateName}
                            onClick={() => engine?.playTone(gateToneMap[gateName])}
                            style={{ backgroundColor: gateToneMap[gateName].color, color: 'hsl(var(--foreground))', textShadow: '1px 1px 2px black' }}
                            className="h-20 text-lg font-bold"
                        >
                            {gateName}
                        </Button>
                    ))}
                </div>
                <Button onClick={handleStartTrials} className="mt-4 bg-teal-600 hover:bg-teal-500">I'm Ready!</Button>
            </div>
        )}
        {gameState !== 'learn' && gameState !== 'loading' && (
            <p>Game logic for 'playing', 'feedback', and 'summary' states would be implemented here.</p>
        )}
      </CardContent>
    </Card>
  );
}
