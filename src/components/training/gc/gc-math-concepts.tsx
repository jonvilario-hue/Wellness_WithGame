
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Calculator, Loader2 } from "lucide-react";
import type { TrainingFocus } from "@/types";
import { useGameEngine } from "@/hooks/use-game-engine";

// --- EXPANDED QUESTION BANK ---
const QUESTION_BANK = {
  level1: [ // Basic Definitions & Terminology (Knowledge Retrieval)
    { question: "What is the term for a number that can only be divided by itself and 1?", options: ["Integer", "Composite Number", "Prime Number"], answer: "Prime Number", explanation: "Prime numbers, like 2, 3, 5, and 7, have exactly two distinct positive divisors." },
    { question: "What do we call the result of a multiplication problem?", options: ["Sum", "Quotient", "Product"], answer: "Product", explanation: "The product is the result of multiplying two or more numbers." },
    { question: "A polygon with four equal sides and four right angles is a...", options: ["Rhombus", "Rectangle", "Square"], answer: "Square", explanation: "A square has the properties of both a rhombus (equal sides) and a rectangle (right angles)." },
    { question: "The top number in a fraction is called the...", options: ["Denominator", "Numerator", "Quotient"], answer: "Numerator", explanation: "The numerator represents the number of parts being considered." },
    { question: "What is the perimeter of a shape?", options: ["The space inside", "The distance around the outside", "The number of corners"], answer: "The distance around the outside", explanation: "Perimeter is the total length of the boundary of a two-dimensional shape." },
    { question: "An angle that is less than 90 degrees is called...", options: ["Obtuse", "Acute", "Right"], answer: "Acute", explanation: "Acute angles are smaller than a right angle (90 degrees)." },
    { question: "In the number 3.14159, what place value does the '4' hold?", options: ["Tenths", "Hundredths", "Thousandths"], answer: "Hundredths", explanation: "The second digit after the decimal point represents the hundredths place." },
    { question: "What is the name for a polygon with 8 sides?", options: ["Hexagon", "Heptagon", "Octagon"], answer: "Octagon", explanation: "An octagon is an eight-sided polygon." },
    { question: "What does the symbol '≠' mean in mathematics?", options: ["Approximately equal to", "Not equal to", "Greater than or equal to"], answer: "Not equal to", explanation: "It signifies that two values are not the same." },
    { question: "The longest side of a right-angled triangle is called the...", options: ["Leg", "Hypotenuse", "Base"], answer: "Hypotenuse", explanation: "The hypotenuse is always opposite the right angle." },
  ],
  level2: [ // Properties, Relationships, Classification (Deeper Knowledge)
    { question: "Which operation has the 'commutative' property (order doesn't matter)?", options: ["Subtraction", "Division", "Addition"], answer: "Addition", explanation: "a + b is always equal to b + a, but a - b is not." },
    { question: "What is the 'identity element' for multiplication?", options: ["0", "1", "-1"], answer: "1", explanation: "Any number multiplied by 1 remains unchanged." },
    { question: "In set theory, what does the 'union' of two sets represent?", options: ["Only elements common to both", "All elements from both combined", "Elements in one but not the other"], answer: "All elements from both combined", explanation: "The union (∪) combines all unique elements from the sets involved." },
    { question: "Which of these numbers is irrational?", options: ["1/3", "√9", "π (pi)"], answer: "π (pi)", explanation: "Irrational numbers cannot be expressed as a simple fraction and have non-repeating decimals." },
    { question: "In the equation y = mx + b, what does 'b' represent?", options: ["Slope", "Y-intercept", "X-coordinate"], answer: "Y-intercept", explanation: "The y-intercept is the point where the line crosses the vertical y-axis." },
    { question: "What is true about the slopes of two perpendicular lines?", options: ["They are equal", "They are reciprocals", "They are negative reciprocals"], answer: "They are negative reciprocals", explanation: "If one slope is 'm', the perpendicular slope is '-1/m'." },
    { question: "Which shape is NOT a quadrilateral?", options: ["Trapezoid", "Pentagon", "Rhombus"], answer: "Pentagon", explanation: "A quadrilateral has four sides, while a pentagon has five." },
    { question: "What does the 'mode' of a data set represent?", options: ["The middle value", "The average value", "The most frequently occurring value"], answer: "The most frequently occurring value", explanation: "The mode is the value that appears most often in a set of data." },
    { question: "The set of all possible input values for a function is called its...", options: ["Range", "Domain", "Codomain"], answer: "Domain", explanation: "The domain defines all the 'x' values for which the function is defined." },
    { question: "Which of the following is a property of parallel lines?", options: ["They intersect at one point", "They intersect at a 90-degree angle", "They never intersect"], answer: "They never intersect", explanation: "Parallel lines in Euclidean geometry remain equidistant from each other." },
  ],
  level3: [ // Abstract Analogies & Multi-step Reasoning
    { question: "Addition is to Subtraction as Multiplication is to ___?", options: ["Sum", "Product", "Division"], answer: "Division", explanation: "They are inverse operations." },
    { question: "Radius is to Circle as ___ is to Square?", options: ["Diagonal", "Side length", "Area"], answer: "Side length", explanation: "Both are fundamental linear measurements that define the scale of their respective shapes." },
    { question: "Derivative is to Rate of Change as ___ is to Area Under a Curve?", options: ["Limit", "Integral", "Function"], answer: "Integral", explanation: "This analogy relates the two fundamental concepts of calculus." },
    { question: "Commutative is to a+b = b+a as Associative is to ___?", options: ["a * (b+c) = ab+ac", "a + (b+c) = (a+b)+c", "a * 1 = a"], answer: "a + (b+c) = (a+b)+c", explanation: "The associative property concerns how numbers are grouped, not their order." },
    { question: "Scalar is to Magnitude as Vector is to ___?", options: ["Direction", "Magnitude and Direction", "A point in space"], answer: "Magnitude and Direction", explanation: "A scalar has only magnitude, while a vector has both magnitude and direction." },
    { question: "Matrix is to Table of Numbers as Determinant is to ___?", options: ["Another matrix", "A single value", "A vector"], answer: "A single value", explanation: "The determinant is a special number that can be calculated from a square matrix." },
    { question: "In logic, what is the 'contrapositive' of the statement 'If P, then Q'?", options: ["If Q, then P", "If not P, then not Q", "If not Q, then not P"], answer: "If not Q, then not P", explanation: "The contrapositive is logically equivalent to the original statement." },
    { question: "A function is considered 'one-to-one' if...", options: ["Every input maps to a unique output", "It forms a straight line", "It is symmetrical"], answer: "Every input maps to a unique output", explanation: "This means no two different inputs will ever produce the same output." },
    { question: "The relationship between an event's probability (P) and its complement is:", options: ["P + P_complement = 1", "P * P_complement = 1", "P = P_complement"], answer: "P + P_complement = 1", explanation: "The probability of an event happening plus the probability of it not happening is always 1." },
    { question: "A 'local maximum' of a function's graph is a point that is...", options: ["The absolute highest point on the graph", "Higher than all its immediate neighbors", "Where the graph crosses the x-axis"], answer: "Higher than all its immediate neighbors", explanation: "It's a peak within a specific interval, but not necessarily the overall highest point." },
  ]
};

// --- Fisher-Yates Shuffle ---
const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function GcMathConcepts({ onGameComplete = () => {} }: { onGameComplete?: (result: any) => void }) {
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const trialStartTime = useRef(0);
  const TOTAL_TRIALS = 15;

  const currentQuestion = useMemo(() => shuffledQuestions[currentTrialIndex], [shuffledQuestions, currentTrialIndex]);

  const startNewSession = useCallback(() => {
    // Shuffle each level and take 5 questions to form the session's question bank
    const level1Questions = shuffle([...QUESTION_BANK.level1]).slice(0, 5);
    const level2Questions = shuffle([...QUESTION_BANK.level2]).slice(0, 5);
    const level3Questions = shuffle([...QUESTION_BANK.level3]).slice(0, 5);
    setShuffledQuestions([...level1Questions, ...level2Questions, ...level3Questions]);
    
    setCurrentTrialIndex(0);
    setResponses([]);
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);

  useEffect(() => {
    setGameState('start');
  }, []);

  const handleAnswer = (option: string) => {
    if (gameState !== 'playing' || !currentQuestion) return;

    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = option === currentQuestion.answer;
    
    setResponses(prev => [...prev, { correct: isCorrect, rt: reactionTimeMs }]);
    setSelectedAnswer(option);
    setGameState('feedback');

    setTimeout(() => {
      if (currentTrialIndex >= TOTAL_TRIALS - 1) {
        setGameState('finished');
        // Finalize and submit score
        const finalResponses = [...responses, { correct: isCorrect, rt: reactionTimeMs }];
        const score = finalResponses.filter(r => r.correct).length;
        const accuracy = score / finalResponses.length;
        const avgResponseTimeMs = finalResponses.reduce((acc, r) => acc + r.rt, 0) / finalResponses.length;
        onGameComplete({ gameId: 'gc_verbal_inference', mode: 'math', score, accuracy, trials: finalResponses, avgResponseTimeMs });
      } else {
        setCurrentTrialIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setGameState('playing');
        trialStartTime.current = Date.now();
      }
    }, 2500); // Give user time to read explanation
  };

  const renderContent = () => {
    if (gameState === 'loading') return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <CardDescription>Test your knowledge of mathematical concepts.</CardDescription>
          <Button onClick={startNewSession} size="lg" className="bg-blue-600 hover:bg-blue-500">Start Session</Button>
        </div>
      );
    }

    if (gameState === 'finished') {
       const score = responses.filter(r => r.correct).length;
       const accuracy = score / responses.length;
       return (
        <div className="text-center space-y-4 animate-in fade-in">
          <CardTitle>Session Complete!</CardTitle>
          <p className="text-xl">Accuracy: {isNaN(accuracy) ? 'N/A' : (accuracy * 100).toFixed(0)}%</p>
          <p className="text-lg">Score: {score} / {TOTAL_TRIALS}</p>
          <Button onClick={startNewSession} size="lg" className="bg-blue-600 hover:bg-blue-500">Play Again</Button>
        </div>
      );
    }

    if (!currentQuestion) return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;

    return (
      <>
        <div className="w-full flex justify-between font-mono text-sm text-blue-200">
          <span>Trial: {currentTrialIndex + 1} / {TOTAL_TRIALS}</span>
          <span>Level: {currentQuestion.level}</span>
        </div>
        <div className="p-6 bg-slate-700/50 rounded-lg w-full text-center min-h-[100px] flex items-center justify-center">
          <p className="text-lg md:text-xl font-medium text-slate-100">{currentQuestion.question}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {currentQuestion.options.map((option: string, index: number) => (
            <Button 
              key={index} 
              onClick={() => handleAnswer(option)}
              disabled={gameState === 'feedback'}
              size="lg"
              variant="outline"
              className={cn(
                "h-auto py-3 whitespace-normal text-left justify-start transition-all duration-300 text-slate-100 bg-slate-800 border-slate-600 hover:bg-slate-700",
                gameState === 'feedback' && option === currentQuestion.answer && "bg-green-500/20 border-green-500 text-white",
                gameState === 'feedback' && selectedAnswer === option && option !== currentQuestion.answer && "bg-rose-500/20 border-rose-500 text-white",
            )}
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="h-20 mt-2 text-center">
          {gameState === 'feedback' && (
            <div className="animate-in fade-in space-y-2">
                <p className={cn("font-semibold", selectedAnswer === currentQuestion.answer ? 'text-green-400' : 'text-rose-400')}>
                    {selectedAnswer === currentQuestion.answer ? "Correct!" : "Incorrect."}
                </p>
                <p className="text-sm text-slate-400">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-2xl bg-slate-800 border-blue-500/30 text-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-blue-300">
            <Calculator />
            (Gc) Math Concepts
        </CardTitle>
        <CardDescription className="text-center text-blue-300/70">
          Test your knowledge of mathematical definitions, concepts, and relationships.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
