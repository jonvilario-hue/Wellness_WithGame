'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Compass, Maximize, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- DATA: Spatial Vocabulary & Logic Questions ---
const SPATIAL_QUESTIONS = [
  {
    id: 1,
    type: 'definition',
    question: "Which term describes the point directly above an observer?",
    options: ["Nadir", "Zenith", "Azimuth", "Horizon"],
    answer: "Zenith",
    explanation: "Zenith is the point on the celestial sphere vertically above a given position."
  },
  {
    id: 2,
    type: 'logic',
    question: "If you are facing North and turn 90 degrees clockwise, then 180 degrees counter-clockwise, which way do you face?",
    options: ["East", "West", "South", "North"],
    answer: "West",
    explanation: "North + 90° CW = East. East + 180° CCW = West."
  },
  {
    id: 3,
    type: 'definition',
    question: "Two lines that never intersect and are not in the same plane are called:",
    options: ["Parallel", "Perpendicular", "Skew", "Oblique"],
    answer: "Skew",
    explanation: "Parallel lines must be in the same plane. Skew lines are in different planes and never touch."
  },
  {
    id: 4,
    type: 'logic',
    question: "Which axis usually represents depth in a standard 3D coordinate system (Right-Hand Rule)?",
    options: ["X-axis", "Y-axis", "Z-axis", "W-axis"],
    answer: "Z-axis",
    explanation: "In most 3D contexts, X is horizontal, Y is vertical, and Z represents depth."
  },
  {
    id: 5,
    type: 'definition',
    question: "What is the term for a shape that looks identical to its mirror image?",
    options: ["Asymmetric", "Chiral", "Achiral", "Isometric"],
    answer: "Achiral",
    explanation: "Chiral objects (like hands) are not superimposable on their mirror image. Achiral objects are."
  }
];

export function GcSpatialLexicon() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 second blitz
  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'finished'>('playing');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Timer Logic
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleAnswer = (option: string) => {
    const currentQ = SPATIAL_QUESTIONS[currentIndex];
    const correct = option === currentQ.answer;
    
    setSelectedOption(option);
    setGameState('feedback');

    if (correct) {
      setScore((prev) => prev + 100);
    }

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIndex < SPATIAL_QUESTIONS.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setGameState('playing');
        setSelectedOption(null);
      } else {
        setGameState('finished');
      }
    }, 1500);
  };

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-in fade-in">
        <Brain className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-3xl font-bold">Session Complete</h2>
        <p className="text-xl">Final Score: <span className='text-primary font-bold'>{score}</span></p>
        <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  const currentQ = SPATIAL_QUESTIONS[currentIndex];
  const isCorrect = selectedOption === currentQ.answer;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      {/* Header Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg">Spatial Lexicon</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Time Remaining</div>
          <div className={cn('text-xl font-mono font-bold', timeLeft < 10 && 'text-destructive')}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <Progress value={(currentIndex / SPATIAL_QUESTIONS.length) * 100} className="h-2" />

      {/* Question Card */}
      <Card className="mt-6 border-primary/20 shadow-lg">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            {currentQ.type === 'logic' ? (
              <RotateCw className="w-12 h-12 text-primary/80" />
            ) : (
              <Maximize className="w-12 h-12 text-green-500/80" />
            )}
          </div>
          
          <h3 className="text-2xl font-semibold text-center mb-8 text-foreground">
            {currentQ.question}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQ.options.map((option) => (
               <Button
                  key={option}
                  variant="outline"
                  className={cn(
                    "h-16 text-lg transition-all duration-300",
                    gameState === 'feedback' && option === currentQ.answer && "bg-green-500/20 border-green-500 text-foreground",
                    gameState === 'feedback' && option === selectedOption && option !== currentQ.answer && "bg-destructive/20 border-destructive text-foreground",
                    gameState === 'feedback' && "opacity-50"
                  )}
                  onClick={() => handleAnswer(option)}
                  disabled={gameState !== 'playing'}
                >
                  {option}
                </Button>
            ))}
          </div>

          {gameState === 'feedback' && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center animate-in fade-in slide-in-from-bottom-2">
              <p className={cn('font-bold', isCorrect ? 'text-green-600' : 'text-destructive')}>
                {isCorrect ? "Correct!" : "Incorrect."}
              </p>
              <p className="text-muted-foreground mt-1">{currentQ.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
