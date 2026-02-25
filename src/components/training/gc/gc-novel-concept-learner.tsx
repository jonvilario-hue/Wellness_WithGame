'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { BookOpenText, Loader2, Sparkles, Check, X } from "lucide-react";
import type { TrainingFocus } from "@/types";

// --- Game Design ---
const EQ_CONCEPTS = [
    { name: 'Schadenfreude', definition: 'Pleasure derived from another\'s misfortune.', example: 'Feeling a little happy when a rival team loses a big game.' },
    { name: 'Cognitive Dissonance', definition: 'Mental discomfort from holding conflicting beliefs or values.', example: 'Feeling uneasy after buying an expensive item you know you don\'t need.' },
    { name: 'Projection', definition: 'Unconsciously attributing one\'s own undesirable traits to another person.', example: 'A person who is habitually dishonest constantly accusing others of lying.' },
    { name: 'Transference', definition: 'Redirecting feelings about one person onto someone else.', example: 'Treating a new boss with suspicion because they remind you of a difficult parent.' },
    { name: 'Alexithymia', definition: 'Difficulty identifying and describing one\'s own emotions.', example: 'Knowing you feel "bad" but being unable to say if you are sad, angry, or anxious.' },
    { name: 'Emotional Contagion', definition: 'The tendency to "catch" feelings from others.', example: 'Feeling suddenly anxious and tense just by being around a stressed-out person.' },
];
type EmotionalConcept = (typeof EQ_CONCEPTS)[0];

const generateTestQuestion = (concepts: EmotionalConcept[]) => {
    const concept = concepts[Math.floor(Math.random() * concepts.length)];
    const options = new Set<string>([concept.name]);
    while (options.size < 4) {
        options.add(EQ_CONCEPTS[Math.floor(Math.random() * EQ_CONCEPTS.length)].name);
    }
    return {
        type: 'scenario' as const,
        question: `Which concept best describes this situation: "${concept.example}"`,
        answer: concept.name,
        options: Array.from(options).sort(() => Math.random() - 0.5)
    };
};
type TestQuestion = ReturnType<typeof generateTestQuestion>;


// --- UI Components ---
const ConceptCard = ({ concept, isFlipped }: { concept: EmotionalConcept, isFlipped: boolean }) => (
    <div className="w-64 h-40 [perspective:1000px]">
        <div className={cn("relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]", isFlipped && "[transform:rotateY(180deg)]")}>
            <div className="absolute w-full h-full [backface-visibility:hidden] bg-amber-100/10 border-2 border-amber-500/30 rounded-lg flex items-center justify-center p-4">
                <span className="text-2xl font-bold text-amber-300">{concept.name}</span>
            </div>
            <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-800 border rounded-lg p-3 flex flex-col justify-center text-center">
                <p className="text-sm text-slate-200">{concept.definition}</p>
            </div>
        </div>
    </div>
);


// --- Main Game Component ---
export function GcNovelConceptLearner({ focus }: { focus: TrainingFocus }) {
    const [phase, setPhase] = useState<'teach' | 'apply' | 'finished'>('teach');
    const [concepts, setConcepts] = useState<EmotionalConcept[]>([]);
    const [learnIndex, setLearnIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [question, setQuestion] = useState<TestQuestion | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const newConcepts = [...EQ_CONCEPTS].sort(() => 0.5 - Math.random()).slice(0, 3);
        setConcepts(newConcepts);
        setQuestion(generateTestQuestion(newConcepts));
    }, []);

    const handleNextLearn = useCallback(() => {
        setIsFlipped(false);
        if (learnIndex < concepts.length - 1) {
            setLearnIndex(i => i + 1);
        } else {
            setPhase('apply');
        }
    }, [learnIndex, concepts.length]);
    
    useEffect(() => {
        if(phase === 'teach') {
            const flipTimer = setTimeout(() => setIsFlipped(true), 2000);
            const nextTimer = setTimeout(handleNextLearn, 4500);
            return () => {
                clearTimeout(flipTimer);
                clearTimeout(nextTimer);
            }
        }
    }, [phase, learnIndex, handleNextLearn]);


    const handleAnswer = (option: string) => {
        if (feedback) return;
        const isCorrect = option === question?.answer;
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) setScore(s => s + 1);

        setTimeout(() => {
            setFeedback(null);
            if (concepts.length > 0) {
                 setQuestion(generateTestQuestion(concepts));
            }
        }, 2000);
    }
    
    const renderContent = () => {
        if (!concepts.length || !question) return <Loader2 className="animate-spin h-10 w-10 text-amber-400" />;

        if (phase === 'teach') {
            const currentConcept = concepts[learnIndex];
            return (
                <div className="flex flex-col items-center gap-4 animate-in fade-in">
                    <p className="text-lg text-amber-200">Learn this emotional concept:</p>
                    <ConceptCard concept={currentConcept} isFlipped={isFlipped} />
                    <p className="text-sm text-muted-foreground">({learnIndex + 1} / {concepts.length})</p>
                </div>
            )
        }

        if (phase === 'apply') {
            return (
                 <div className="flex flex-col items-center gap-4 w-full max-w-lg animate-in fade-in">
                    <p className="text-lg font-semibold text-center text-amber-200">{question.question}</p>
                    
                    <div className="h-8 mt-2">
                        {feedback && (
                            <div className={cn("text-2xl font-bold flex items-center gap-2", feedback === 'correct' ? 'text-green-400' : 'text-red-400')}>
                                {feedback === 'correct' ? <Check /> : <X />}
                                {feedback === 'correct' ? "Correct!" : `Incorrect. It was ${question.answer}.`}
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {question.options.map((opt, i) => (
                            <Button 
                                key={i} 
                                variant="outline" 
                                className="h-20 text-lg"
                                onClick={() => handleAnswer(opt)} 
                                disabled={!!feedback}>
                               {opt}
                            </Button>
                        ))}
                    </div>
                 </div>
            )
        }
    }


    return (
        <Card className="w-full max-w-2xl bg-slate-900 border-amber-500/20 text-slate-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-amber-300">
                    <Sparkles />
                    (Gc) Novel Concept Acquisition
                </CardTitle>
                <CardDescription className="text-amber-100/60">
                    First, learn the definition of new emotional concepts. Then, apply that new knowledge to classify real-world scenarios.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
