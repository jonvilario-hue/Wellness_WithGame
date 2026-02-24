
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BookOpenText, Loader2, Sparkles, Check, X } from "lucide-react";
import type { TrainingFocus } from "@/types";

// --- Game Design ---
const SYMBOL_COUNT = 6;
const PROPERTIES = {
    color: ['red', 'blue', 'green'],
    shape: ['circle', 'square', 'triangle'],
    texture: ['solid', 'striped', 'dotted'],
};
const GLYPHS = ['Æ', 'Ψ', 'Ø', 'Þ', 'Ŋ', 'Ɣ', 'λ', 'δ', 'Σ', 'Ω'];

type PropertyBundle = { color: string; shape: string; texture: string; };
type SymbolConcept = { glyph: string; meaning: PropertyBundle; };

// --- Generators ---
const generateConcepts = (): SymbolConcept[] => {
    const shuffledGlyphs = [...GLYPHS].sort(() => 0.5 - Math.random());
    const concepts: SymbolConcept[] = [];
    for (let i = 0; i < SYMBOL_COUNT; i++) {
        concepts.push({
            glyph: shuffledGlyphs[i],
            meaning: {
                color: PROPERTIES.color[i % 3],
                shape: PROPERTIES.shape[Math.floor(i / 3) % 3],
                texture: PROPERTIES.texture[i % 2],
            }
        });
    }
    return concepts;
};

const generateAnalogyQuestion = (concepts: SymbolConcept[]) => {
    const [a, b, c] = [...concepts].sort(() => 0.5 - Math.random());
    const answer = { ...c.meaning, color: b.meaning.color }; // Example rule: C's shape/texture + B's color
    
    const options = new Set<string>([JSON.stringify(answer)]);
    while(options.size < 4) {
        const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
        const randomColor = PROPERTIES.color[Math.floor(Math.random() * PROPERTIES.color.length)];
        options.add(JSON.stringify({ ...randomConcept.meaning, color: randomColor }));
    }
    
    return {
        type: 'analogy' as const,
        question: `If ${a.glyph} is to ${b.glyph}, then ${c.glyph} is to...?`,
        a, b, c,
        answer: JSON.stringify(answer),
        options: Array.from(options).sort(() => Math.random() - 0.5).map(o => JSON.parse(o))
    };
};
type AnalogyQuestion = ReturnType<typeof generateAnalogyQuestion>;


// --- UI Components ---
const SymbolCard = ({ glyph, meaning, isFlipped }: { glyph: string; meaning: PropertyBundle, isFlipped: boolean }) => (
    <div className="w-32 h-40 [perspective:1000px]">
        <div className={cn("relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]", isFlipped && "[transform:rotateY(180deg)]")}>
            <div className="absolute w-full h-full [backface-visibility:hidden] bg-amber-100/10 border-2 border-amber-500/30 rounded-lg flex items-center justify-center">
                <span className="text-6xl font-bold text-amber-300">{glyph}</span>
            </div>
            <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-800 border rounded-lg p-2 flex flex-col justify-center items-center gap-1 text-center">
                <p className="font-bold capitalize text-amber-300">{meaning.color}</p>
                <p className="capitalize text-slate-300">{meaning.shape}</p>
                <p className="capitalize text-slate-300">{meaning.texture}</p>
            </div>
        </div>
    </div>
);

const PropertyDisplay = ({ meaning }: { meaning: PropertyBundle }) => (
    <div className="p-3 border rounded-md bg-slate-800 flex flex-col items-center justify-center gap-1">
        <p className="font-bold capitalize text-amber-300">{meaning.color}</p>
        <p className="capitalize text-slate-300">{meaning.shape}</p>
        <p className="capitalize text-slate-300">{meaning.texture}</p>
    </div>
)

// --- Main Game Component ---
export function GcNovelConceptLearner({ focus }: { focus: TrainingFocus }) {
    const [phase, setPhase] = useState<'teach' | 'apply' | 'finished'>('teach');
    const [concepts, setConcepts] = useState<SymbolConcept[]>([]);
    const [learnIndex, setLearnIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [question, setQuestion] = useState<AnalogyQuestion | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const newConcepts = generateConcepts();
        setConcepts(newConcepts);
        setQuestion(generateAnalogyQuestion(newConcepts));
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
            const flipTimer = setTimeout(() => setIsFlipped(true), 1500);
            const nextTimer = setTimeout(handleNextLearn, 3500);
            return () => {
                clearTimeout(flipTimer);
                clearTimeout(nextTimer);
            }
        }
    }, [phase, learnIndex, handleNextLearn]);


    const handleAnswer = (option: PropertyBundle) => {
        if (feedback) return;
        const isCorrect = JSON.stringify(option) === question?.answer;
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) setScore(s => s + 1);

        setTimeout(() => {
            setFeedback(null);
            if (concepts.length > 0) {
                 setQuestion(generateAnalogyQuestion(concepts));
            }
        }, 2000);
    }
    
    const renderContent = () => {
        if (!concepts.length || !question) return <Loader2 className="animate-spin h-10 w-10 text-amber-400" />;

        if (phase === 'teach') {
            const currentConcept = concepts[learnIndex];
            return (
                <div className="flex flex-col items-center gap-4 animate-in fade-in">
                    <p className="text-lg text-amber-200">Learn the meaning of this symbol:</p>
                    <SymbolCard glyph={currentConcept.glyph} meaning={currentConcept.meaning} isFlipped={isFlipped} />
                    <p className="text-sm text-muted-foreground">({learnIndex + 1} / {concepts.length})</p>
                </div>
            )
        }

        if (phase === 'apply') {
            return (
                 <div className="flex flex-col items-center gap-4 w-full max-w-lg animate-in fade-in">
                    <p className="text-lg font-semibold text-center text-amber-200">{question.question}</p>
                    <div className="flex items-center justify-center gap-4 text-4xl font-bold text-slate-300">
                        <span>{question.a.glyph}</span> 
                        <span>→</span>
                        <span>{question.b.glyph}</span>
                        <span className="text-amber-400 mx-4">::</span>
                        <span>{question.c.glyph}</span>
                        <span>→</span>
                        <span className="text-amber-400">?</span>
                    </div>

                    <div className="h-8 mt-2">
                        {feedback && (
                            <div className={cn("text-2xl font-bold flex items-center gap-2", feedback === 'correct' ? 'text-green-400' : 'text-red-400')}>
                                {feedback === 'correct' ? <Check /> : <X />}
                                {feedback === 'correct' ? "Correct!" : "Incorrect"}
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {question.options.map((opt, i) => (
                            <Button key={i} variant="outline" className="h-auto p-0 bg-transparent hover:bg-amber-900/50 border-amber-500/30" onClick={() => handleAnswer(opt)} disabled={!!feedback}>
                               <PropertyDisplay meaning={opt} />
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
                    First, learn the meaning of new symbols. Then, use that new knowledge to solve logic puzzles.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
