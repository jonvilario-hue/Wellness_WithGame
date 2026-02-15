
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BookOpenText } from "lucide-react";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

const neutralPuzzles = [
  {
    type: 'analogy',
    question: "Doctor is to hospital as teacher is to ____.",
    options: ["Book", "Student", "School", "Pencil"],
    answer: "School",
    explanation: "A doctor works in a hospital, and a teacher works in a school. The relationship is person to workplace."
  },
  {
    type: 'context',
    question: "The river, widened by weeks of rain, began to ____ the nearby village with murky water.",
    options: ["evaporate", "inundate", "solidify", "irrigate"],
    answer: "inundate",
    explanation: "'Inundate' means to flood or overwhelm, which fits the context of a widened river and a village."
  },
  {
    type: 'inference',
    question: "Despite the chaos around him, the monk remained ____, a silent anchor in a swirling storm.",
    options: ["agitated", "boisterous", "imperturbable", "volatile"],
    answer: "imperturbable",
    explanation: "'Imperturbable' means unable to be upset or excited; calm. This contrasts with the surrounding chaos."
  },
  {
    type: 'relationship',
    question: "Which word does not belong with the others?",
    options: ["Branch", "Leaf", "Root", "Feather"],
    answer: "Feather",
    explanation: "Branch, leaf, and root are all parts of a tree. A feather is part of a bird."
  },
  {
    type: 'analogy',
    question: "Oar is to sailboat as pedal is to ____.",
    options: ["Car", "Bicycle", "Boat", "Plane"],
    answer: "Bicycle",
    explanation: "An oar propels a sailboat (traditionally), and a pedal propels a bicycle."
  },
  {
    type: 'context',
    question: "Her ____ nature made her the perfect diplomat; she could find common ground in any disagreement.",
    options: ["conciliatory", "argumentative", "apathetic", "stubborn"],
    answer: "conciliatory",
    explanation: "'Conciliatory' means intended to placate or pacify, which is ideal for a diplomat."
  },
  {
    type: 'inference',
    question: "The ancient text was ____, filled with cryptic symbols that had puzzled scholars for centuries.",
    options: ["lucid", "straightforward", "esoteric", "commonplace"],
    answer: "esoteric",
    explanation: "'Esoteric' means intended for or likely to be understood by only a small number of people with specialized knowledge, which fits the description of a cryptic ancient text."
  },
  {
    type: 'relationship',
    question: "Which word does not belong with the others?",
    options: ["Triangle", "Circle", "Square", "Sphere"],
    answer: "Sphere",
    explanation: "Triangle, Circle, and Square are two-dimensional shapes. A Sphere is a three-dimensional shape."
  },
  {
    type: 'analogy',
    question: "Writer is to pen as painter is to ____.",
    options: ["Canvas", "Studio", "Brush", "Color"],
    answer: "Brush",
    explanation: "A writer uses a pen as their primary tool, and a painter uses a brush."
  },
  {
    type: 'context',
    question: "The politician's speech was full of ____, vague promises that ultimately meant nothing.",
    options: ["platitudes", "specifics", "facts", "data"],
    answer: "platitudes",
    explanation: "'Platitudes' are remarks or statements, especially ones with a moral content, that have been used too often to be interesting or thoughtful."
  },
  {
    type: 'inference',
    question: "After hiking for hours under the hot sun, the explorer was relieved to find a source of ____ water.",
    options: ["brackish", "potable", "stagnant", "turbid"],
    answer: "potable",
    explanation: "'Potable' means safe to drink, which would be a relief for a thirsty explorer."
  },
  {
    type: 'relationship',
    question: "Which word does not belong with the others?",
    options: ["Run", "Swim", "Fly", "Think"],
    answer: "Think",
    explanation: "Run, Swim, and Fly are all forms of physical movement. Think is a mental process."
  },
];

const mathPuzzles = [
  {
    type: 'word-problem',
    question: "A train travels 300 miles in 5 hours. What is its average speed in miles per hour?",
    options: ["50 mph", "60 mph", "70 mph", "55 mph"],
    answer: "60 mph",
    explanation: "Speed is distance divided by time (300 miles / 5 hours = 60 mph)."
  },
  {
    type: 'logic',
    question: "If X > Y and Y > Z, which statement is definitely true?",
    options: ["X < Z", "X = Z", "X > Z", "Y > X"],
    answer: "X > Z",
    explanation: "This is the transitive property of inequality. If X is greater than Y, and Y is greater than Z, then X must be greater than Z."
  },
  {
    type: 'pattern',
    question: "What is the next number in the sequence: 3, 7, 15, 31, __?",
    options: ["45", "55", "63", "71"],
    answer: "63",
    explanation: "The pattern is to multiply by 2 and add 1 (3*2+1=7, 7*2+1=15, 15*2+1=31, 31*2+1=63)."
  },
  {
    type: 'analogy',
    question: "Perimeter is to square as circumference is to ____.",
    options: ["Area", "Diameter", "Circle", "Radius"],
    answer: "Circle",
    explanation: "Perimeter is the boundary of a square, and circumference is the boundary of a circle."
  },
   {
    type: 'word-problem',
    question: "If an item costs $45 after a 10% discount, what was the original price?",
    options: ["$49.50", "$50", "$40.50", "$55"],
    answer: "$50",
    explanation: "The discounted price is 90% of the original. Original Price = $45 / 0.90 = $50."
  },
  {
    type: 'logic',
    question: "If all cats are mammals, and a tiger is a cat, then a tiger is a ____.",
    options: ["Reptile", "Fish", "Mammal", "Amphibian"],
    answer: "Mammal",
    explanation: "This is a simple syllogism. If the first two premises are true, the conclusion must be true."
  },
  {
    type: 'pattern',
    question: "What is the next number in the sequence: 1, 4, 9, 16, __?",
    options: ["20", "25", "36", "30"],
    answer: "25",
    explanation: "The sequence consists of perfect squares (1^2, 2^2, 3^2, 4^2, 5^2)."
  },
  {
    type: 'analogy',
    question: "Addition is to sum as multiplication is to ____.",
    options: ["Difference", "Quotient", "Product", "Factor"],
    answer: "Product",
    explanation: "The result of addition is a sum, and the result of multiplication is a product."
  },
  {
    type: 'word-problem',
    question: "A pizza is cut into 8 slices. If you eat 3/8 of the pizza, how many slices are left?",
    options: ["3", "4", "5", "6"],
    answer: "5",
    explanation: "If you eat 3 slices out of 8, there are 8 - 3 = 5 slices remaining."
  },
  {
    type: 'logic',
    question: "A is the father of B, but B is not the son of A. What is the relationship?",
    options: ["B is A's nephew", "B is A's uncle", "B is A's daughter", "Not possible"],
    answer: "B is A's daughter",
    explanation: "If B is not A's son, then B must be A's daughter."
  },
  {
    type: 'pattern',
    question: "What is the next term in the sequence: A, C, F, J, __?",
    options: ["L", "M", "N", "O"],
    answer: "O",
    explanation: "The gap between letters increases by 1 each time: +2 (A-C), +3 (C-F), +4 (F-J), so the next is +5 (J-O)."
  },
  {
    type: 'analogy',
    question: "Inch is to length as ounce is to ____.",
    options: ["Weight", "Volume", "Time", "Temperature"],
    answer: "Weight",
    explanation: "An inch is a unit of length, and an ounce is a unit of weight."
  },
];

const musicPuzzles = [
  {
    type: 'terminology',
    question: "Which term refers to the speed of a piece of music?",
    options: ["Dynamics", "Tempo", "Rhythm", "Pitch"],
    answer: "Tempo",
    explanation: "Tempo is the speed or pace of a given piece."
  },
  {
    type: 'analogy',
    question: "Verse is to song as chapter is to ____.",
    options: ["Poem", "Book", "Paragraph", "Page"],
    answer: "Book",
    explanation: "A verse is a section of a song, just as a chapter is a section of a book."
  },
  {
    type: 'inference',
    question: "A piece of music marked 'Adagio' should be played ____.",
    options: ["Quickly and lively", "At a walking pace", "Slowly and stately", "Very fast"],
    answer: "Slowly and stately",
    explanation: "'Adagio' is an Italian musical term meaning to be played slowly."
  },
  {
    type: 'relationship',
    question: "Which instrument does not belong in the string family?",
    options: ["Violin", "Cello", "Flute", "Guitar"],
    answer: "Flute",
    explanation: "A flute is a woodwind instrument, while the others are string instruments."
  },
  {
    type: 'context',
    question: "The orchestra's performance reached a powerful ____, with every instrument playing at full volume.",
    options: ["crescendo", "diminuendo", "staccato", "coda"],
    answer: "crescendo",
    explanation: "'Crescendo' means a gradual increase in loudness, fitting the context of a powerful climax."
  },
  {
    type: 'terminology',
    question: "A 'C Major' chord consists of which three notes?",
    options: ["C, D, E", "C, E, G", "C, F, G", "C, D, G"],
    answer: "C, E, G",
    explanation: "A major chord is built from the root (C), a major third (E), and a perfect fifth (G)."
  },
];

type Puzzle = (typeof neutralPuzzles)[0];

export function VerbalInferenceBuilder() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [shuffledPuzzles, setShuffledPuzzles] = useState<Puzzle[]>([]);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(''); // '', 'correct', 'incorrect'
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  const [gameState, setGameState] = useState('playing'); // playing, finished
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { logGameResult } = usePerformanceStore();
  
  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isLoaded ? (override || globalFocus) : 'neutral';
  
  const puzzleSet = useMemo(() => {
    switch (currentMode) {
        case 'math': return mathPuzzles;
        case 'music': return musicPuzzles;
        default: return neutralPuzzles;
    }
  }, [currentMode]);

  const restartGame = useCallback(() => {
    setShuffledPuzzles([...puzzleSet].sort(() => Math.random() - 0.5));
    setCurrentPuzzleIndex(0);
    setScore(0);
    setStartTime(Date.now());
    setFeedback('');
    setInlineFeedback({ message: '', type: '' });
    setSelectedAnswer(null);
    setGameState('playing');
  }, [puzzleSet]);
  
  useEffect(() => {
    if (isLoaded) {
      restartGame();
    }
  }, [isLoaded, restartGame]);

  const currentPuzzle = shuffledPuzzles[currentPuzzleIndex];

  const handleAnswer = (option: string) => {
    if (feedback || !currentPuzzle) return;

    const isCorrect = option === currentPuzzle.answer;
    setSelectedAnswer(option);
    if (isCorrect) {
      setScore(score + 1);
      setFeedback('correct');
      setInlineFeedback({ message: getSuccessFeedback('Gc'), type: 'success' });
    } else {
      setFeedback('incorrect');
      setInlineFeedback({ message: getFailureFeedback('Gc'), type: 'failure' });
    }

    const isLastPuzzle = currentPuzzleIndex === shuffledPuzzles.length - 1;

    if (isLastPuzzle) {
        const time = (Date.now() - startTime) / 1000;
        const finalScore = isCorrect ? score + 1 : score;
        logGameResult('Gc', currentMode, { score: finalScore, time });
        setGameState('finished');
    } else {
        setTimeout(() => {
            setCurrentPuzzleIndex(currentPuzzleIndex + 1);
            setFeedback('');
            setInlineFeedback({ message: '', type: '' });
            setSelectedAnswer(null);
        }, 2500);
    }
  };
  
  const getButtonClass = (option: string) => {
    if (!feedback || !currentPuzzle) return "secondary";

    if (option === currentPuzzle.answer) {
      return "bg-green-600 hover:bg-green-700 text-white";
    }
    
    if (option === selectedAnswer && feedback === 'incorrect') {
      return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
    }

    return "secondary";
  }

  if (shuffledPuzzles.length === 0 || !currentPuzzle || !isLoaded) {
    return (
      <Card className="w-full max-w-2xl text-center">
        <CardContent className="flex items-center justify-center h-48">
          <p>Loading puzzles...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <BookOpenText />
            (Gc) Verbal Inference Builder
        </CardTitle>
        <CardDescription className="text-center">Deduce the meaning or relationship from the context provided.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {gameState === 'playing' ? (
          <>
            <div className="w-full text-right font-mono">Score: {score} / {shuffledPuzzles.length}</div>
            <div className="p-6 bg-muted rounded-lg w-full text-center min-h-[100px] flex items-center justify-center">
              <p className="text-lg md:text-xl font-medium">{currentPuzzle.question}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentPuzzle.options.map((option, index) => (
                <Button 
                  key={index} 
                  onClick={() => handleAnswer(option)}
                  disabled={!!feedback}
                  size="lg"
                  className={cn(
                    "h-auto py-3 whitespace-normal transition-all duration-300",
                    getButtonClass(option)
                  )}
                >
                  {option}
                </Button>
              ))}
            </div>
            <div className="h-16 mt-2 text-center">
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
              {feedback && !gameState.includes('finished') && (
                <div className="animate-in fade-in">
                    <p className="text-sm text-muted-foreground">{currentPuzzle.explanation}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center space-y-4 animate-in fade-in">
            <CardTitle>Puzzle Set Complete!</CardTitle>
            <p className="text-xl">Your final score is: <span className="font-bold text-primary">{score} out of {shuffledPuzzles.length}</span></p>
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold">Last Question Explanation:</p>
                <p className="text-sm text-muted-foreground">{currentPuzzle.explanation}</p>
            </div>
            <Button onClick={restartGame} size="lg">Play Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
