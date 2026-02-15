
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Volume2, Loader2, Lightbulb } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useToast } from "@/hooks/use-toast";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { cn } from "@/lib/utils";

type Operation = '+' | '-' | '*';
const numberWords: { [key: number]: string } = {
  0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine",
  10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen",
  20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety"
};
const operationWords: { [key: string]: string } = { '+': "plus", '-': "minus", '*': "times" };

const generateQuestion = (level: number): { text: string; answer: number } => {
  const ops: Operation[] = ['+', '-', '*'];
  let question = "";
  let formula = "";
  
  const numOperations = Math.floor(level / 2) + 1;
  let firstNum = Math.floor(Math.random() * 9) + 1;
  question = `What is ${numberWords[firstNum]}`;
  formula += firstNum;

  for (let i = 0; i < numOperations; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let nextNum = Math.floor(Math.random() * 9) + 1;
    
    if (op === '*' && nextNum === 0) nextNum = 1;
    if (op === '-' && eval(formula) < nextNum) {
      const temp = eval(formula);
      formula = `${nextNum} - ${temp}`;
      question = `What is ${numberWords[nextNum]} minus ${numberWords[temp]}`;
      continue;
    }

    question += `, ${operationWords[op]} ${numberWords[nextNum]}`;
    formula += ` ${op} ${nextNum}`;
  }

  return { text: question + "?", answer: eval(formula) };
};

export function SpokenArithmeticChallenge() {
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState<{ text: string; answer: number } | null>(null);
  const [gameState, setGameState] = useState('idle'); // idle, generating, speaking, answering, feedback
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [startTime, setStartTime] = useState(0);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  const { toast } = useToast();
  const { logGameResult } = usePerformanceStore();
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) {
      toast({
        title: "Speech Synthesis not supported",
        description: "Your browser does not support the Web Speech API.",
        variant: "destructive",
      });
      return;
    }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = () => setGameState('answering');
    synthRef.current.speak(utterance);
  }, [toast]);
  
  const handleStart = useCallback(() => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameState('generating');
    setInlineFeedback({ message: '', type: '' });
    const q = generateQuestion(1);
    setQuestion(q);
    setGameState('speaking');
    speak(q.text);
    setStartTime(Date.now());
  }, [speak]);

  const nextLevel = useCallback((currentLevel: number) => {
    setUserAnswer('');
    setGameState('generating');
    setInlineFeedback({ message: '', type: '' });
    const q = generateQuestion(currentLevel);
    setQuestion(q);
    setGameState('speaking');
    speak(q.text);
    setStartTime(Date.now());
  }, [speak]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== 'answering' || !question) return;

    setGameState('feedback');
    const time = (Date.now() - startTime) / 1000;
    const isCorrect = parseInt(userAnswer, 10) === question.answer;

    if (isCorrect) {
      setScore(prev => prev + (level * 10));
      logGameResult('Ga', 'math', { score: level * 10, time });
      setInlineFeedback({ message: getSuccessFeedback('Ga'), type: 'success' });
      setTimeout(() => {
        const nextLvl = level + 1;
        setLevel(nextLvl);
        nextLevel(nextLvl);
      }, 1500);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      logGameResult('Ga', 'math', { score: 0, time });
      setInlineFeedback({ message: `Correct answer: ${question.answer}. ${getFailureFeedback('Ga')}`, type: 'failure' });
      
      setTimeout(() => {
        if (newLives > 0) {
          nextLevel(level);
        } else {
          setGameState('finished');
        }
      }, 2000);
    }
  };

  if (gameState === 'finished') {
    return (
      <Card className="w-full max-w-xl text-center">
        <CardHeader>
          <CardTitle>Game Over</CardTitle>
          <CardDescription>You've completed your auditory math session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl font-bold">Final Score: {score}</p>
          <Button onClick={handleStart} size="lg">Play Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl text-center">
      <CardHeader>
        <CardTitle>(Ga) Spoken Arithmetic Challenge</CardTitle>
        <CardDescription>Listen to the spoken math problem, calculate the answer in your head, and type the result.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
        {gameState === 'idle' && <Button onClick={handleStart} size="lg">Start Game</Button>}
        
        {['generating', 'speaking', 'answering', 'feedback'].includes(gameState) && (
          <div className="w-full space-y-4">
            <div className="flex justify-between font-mono text-lg">
              <span>Level: {level}</span>
              <span>Score: {score}</span>
              <span>Lives: {lives}</span>
            </div>

            <Button
              onClick={() => question && speak(question.text)}
              disabled={gameState !== 'answering'}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {gameState === 'speaking' ?
                <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Listening...</> :
                <><Volume2 className="w-6 h-6 mr-2" /> Replay Question</>
              }
            </Button>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="number"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="text-center text-2xl h-14"
                disabled={gameState !== 'answering'}
                autoFocus
              />
              <Button type="submit" size="lg" disabled={gameState !== 'answering'}>Submit</Button>
            </form>
             <div className="h-6 text-sm font-semibold">
              {inlineFeedback.message && (
                <p className={cn(
                  "animate-in fade-in",
                  inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600'
                )}>
                  {inlineFeedback.message}
                </p>
              )}
            </div>
             <div className="p-3 bg-muted rounded-lg text-left text-sm text-muted-foreground flex items-start gap-2">
                <Lightbulb className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                <span>This exercise strengthens auditory working memory and mental math skills by forcing you to hold and manipulate numbers you hear, not see.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
