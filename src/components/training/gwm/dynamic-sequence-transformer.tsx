'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemoryStick, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { cn } from "@/lib/utils";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { phoneticallySimilarSets, grammarScrambleSentences } from "@/data/verbal-content";
import { GameStub } from "../game-stub";
import { StateMachineTracer } from "../logic/state-machine-tracer";

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

const generateSequence = (length: number, charSet: string) => {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (charSet === 'alphanumeric') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  if (charSet === 'numeric') chars = '0123456789';
  if (charSet === 'numeric_ops') chars = '0123456789+-*/=';
  if (charSet === 'notes') chars = 'CDEFGAB';
  if (charSet === 'notes_symbols') chars = 'CDEFGAB♩♪♫♭♯♮';
  
  // This part is modified based on the audit. We now use real words for phonological tasks.
  if (charSet === 'phonological_similar') {
    const set = phoneticallySimilarSets[Math.floor(Math.random() * phoneticallySimilarSets.length)];
    return set.slice(0, length).join(' ');
  }
  if (charSet === 'phonological_distinct') {
     const distinctWords = ['CAT', 'DOG', 'SUN', 'SKY', 'RED', 'BLUE', 'ONE', 'TWO'];
     return distinctWords.sort(() => 0.5 - Math.random()).slice(0, length).join(' ');
  }


  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const tasks = [
  { id: 'reverse', label: "Repeat the sequence backward." },
  { id: 'alpha_only', label: "Repeat only the letters, in order." },
  { id: 'numeric_only', label: "Repeat only the numbers, in order." },
  { id: 'remove_first', label: "Repeat the sequence, removing the first character." },
  { id: 'alpha_shift', label: "Repeat the letters, shifting each forward by one (A->B, Z->A)." },
  { id: 'every_other', label: "Repeat every other character, starting with the first." },
  { id: 'sentence_unscramble', label: "Unscramble the words to form a grammatical sentence." },
];

export function DynamicSequenceTransformer() {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'memorizing' | 'answering' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [sequence, setSequence] = useState('');
  const [task, setTask] = useState(tasks[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const correctSentenceRef = useRef('');

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

  useEffect(() => {
    if (isComponentLoaded) {
      const initialState = getAdaptiveState(GAME_ID);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode, getAdaptiveState]);

  const startNewTrial = useCallback((state: AdaptiveState) => {
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;

    const levelDef = policy.levelMap[loadedLevel] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const { mechanic_config } = levelDef;
    const content_config = levelDef.content_config[currentMode];
    if (!content_config || !content_config.params) throw new Error("Invalid content config");
    
    let newTask = tasks.find(t => t.id === content_config.sub_variant) || tasks[0];
    let newSequence = '';

    if(content_config.sub_variant === 'sentence_unscramble') {
        const sentenceData = grammarScrambleSentences[Math.floor(Math.random() * grammarScrambleSentences.length)];
        correctSentenceRef.current = sentenceData.sentence;
        newSequence = sentenceData.sentence.split(' ').sort(() => Math.random() - 0.5).join(' ');
        newTask = tasks.find(t => t.id === 'sentence_unscramble')!;
    } else {
        newSequence = generateSequence(mechanic_config.sequenceLength, content_config.params.charSet);
        const availableTasks = tasks.filter(t => t.id !== 'sentence_unscramble');
        newTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
    }
    
    setSequence(newSequence);
    setTask(newTask);
    setUserAnswer('');
    setFeedback('');
    setGameState('memorizing');
    
    // Per audit decision: present verbal stimuli visually due to TTS unreliability
    const displayTime = currentMode === 'verbal' ? mechanic_config.visualDisplayTimeMs || 800 : mechanic_config.displayTimeMs || 1500;

    setTimeout(() => {
      setGameState('answering');
      trialStartTime.current = Date.now();
    }, displayTime);
  }, [currentMode]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);
  
  const correctAnswer = useMemo(() => {
    if (!sequence || !task) return '';
    switch(task.id) {
        case 'reverse': return sequence.split('').reverse().join('');
        case 'alpha_only': return sequence.replace(/[^A-Z♩♪♫♭♯♮]/gi, '');
        case 'numeric_only': return sequence.replace(/[^0-9+\-*/=]/g, '');
        case 'remove_first': return sequence.substring(1);
        case 'sentence_unscramble': return correctSentenceRef.current;
        case 'alpha_shift':
            return sequence.replace(/[^A-Z]/gi, '').split('').map(char => 
                char.toUpperCase() === 'Z' ? 'A' : String.fromCharCode(char.charCodeAt(0) + 1)
            ).join('');
        case 'every_other':
            return sequence.split('').filter((_, i) => i % 2 === 0).join('');
        default: return sequence; // Default to simple recall for verbal tasks
    }
  }, [sequence, task]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== 'answering' || !adaptiveState) return;
    
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    
    let isCorrect = userAnswer.trim().toUpperCase() === correctAnswer.toUpperCase();
    // Normalize punctuation for sentence unscramble
    if (task.id === 'sentence_unscramble') {
        const normalize = (str: string) => str.toUpperCase().replace(/[.,!?]/g, '');
        isCorrect = normalize(userAnswer.trim()) === normalize(correctAnswer);
    }

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setFeedback(isCorrect ? getSuccessFeedback('Gwm') : `Incorrect. The answer was: ${correctAnswer}. ${getFailureFeedback('Gwm')}`);

    setTimeout(() => {
        currentTrialIndex.current++;
        if(currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(finalState);
        } else {
            startNewTrial(newState);
        }
    }, 2500);

  }, [gameState, userAnswer, correctAnswer, adaptiveState, sessionTrials, updateAdaptiveState, startNewTrial, task.id]);
  
  if (currentMode === 'spatial') {
    return <GameStub 
        name="Spatial Span"
        description="A set of 3D cubes in space flash in a specific sequence. User must repeat the sequence by clicking the cubes in the correct order. This tests your ability to hold and recall a series of spatial locations in working memory."
        chcFactor="Working Memory (Gwm) / Dynamic Tracking"
        techStack={['CSS 3D Transforms']}
        complexity="High"
        fallbackPlan="Use a 2D grid. The core mechanic of recalling a sequence of locations is preserved, but without the 3D rendering overhead."
    />;
  }

  if (currentMode === 'logic') {
    return <StateMachineTracer />;
  }


  const renderContent = () => {
    if (!isComponentLoaded || gameState === 'loading') {
       return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    switch (gameState) {
      case 'start':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
            <Button onClick={startNewSession} size="lg">Start Session</Button>
          </div>
        );
      case 'memorizing':
        return (
          <div className="text-center space-y-4 animate-in fade-in">
            <p className="font-semibold text-muted-foreground">Memorize this sequence:</p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-4xl font-mono tracking-widest">{sequence}</p>
            </div>
            <p className="text-sm text-primary animate-pulse">Prepare to answer...</p>
          </div>
        );
      case 'answering':
      case 'feedback':
        return (
          <div className="w-full space-y-4 text-center animate-in fade-in">
            <div className="font-mono text-lg">Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xl font-semibold">{task.label}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your transformed answer"
                className="text-center text-lg"
                disabled={gameState === 'feedback'}
                autoFocus
              />
              <Button type="submit" disabled={gameState === 'feedback'}>Submit Answer</Button>
            </form>
            {gameState === 'feedback' && (
              <div className="mt-4 text-center text-xl font-bold animate-in fade-in">
                <p className={cn(feedback.includes('Incorrect') ? 'text-amber-600' : 'text-green-600')}>{feedback}</p>
              </div>
            )}
          </div>
        );
      case 'finished':
          const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
        return (
            <div className="flex flex-col items-center gap-4">
                <CardTitle>Session Complete!</CardTitle>
                <p>Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0) + '%'}</p>
                <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
            </div>
        )
    }
  };

  return (
    <Card className="w-full max-w-2xl text-center bg-cyan-900/10 border-cyan-500/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-cyan-400">
            <MemoryStick />
            (Gwm) Dynamic Sequence
        </CardTitle>
        <CardDescription className="text-cyan-400/70">Memorize the sequence, then transform it as instructed.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
