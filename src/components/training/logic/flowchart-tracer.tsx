
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Share2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { generateGvLogicTrial, type FlowchartTrial } from '@/lib/logic-stimulus-factory';
import { PRNG } from '@/lib/rng';
import { getLayoutedElements } from '@/lib/spatial-layout';

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

const FlowchartNode = ({ node, layout }: { node: any, layout: any }) => {
    const nodeStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${layout.x - layout.width / 2}px`,
        top: `${layout.y - layout.height / 2}px`,
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0.5rem',
        border: '2px solid',
        color: 'white',
    };

    if (node.type === 'terminal') {
        return <div style={{ ...nodeStyle, borderRadius: '9999px', borderColor: '#45475a', backgroundColor: '#313244' }}>{node.label}</div>;
    }
    if (node.type === 'decision') {
        return (
            <div style={{...nodeStyle, transform: 'rotate(45deg)', borderColor: '#89b4fa', backgroundColor: '#1e1e2e'}}>
                <span style={{transform: 'rotate(-45deg)'}}>{node.label}</span>
            </div>
        );
    }
    return <div style={{ ...nodeStyle, borderRadius: '0.25rem', borderColor: '#6c7086', backgroundColor: '#1e1e2e' }}>{node.label}</div>;
};

const FlowchartEdge = ({ edge, layout }: { edge: any, layout: any }) => {
    const points = layout.points.map((p: any) => `${p.x},${p.y}`).join(' ');
    const arrowId = `arrow-${edge.v}-${edge.w}`;
    return (
        <g>
            <defs>
                <marker id={arrowId} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#6c7086" />
                </marker>
            </defs>
            <polyline points={points} fill="none" stroke="#6c7086" strokeWidth="2" markerEnd={`url(#${arrowId})`} />
            {edge.label && layout.points.length > 0 && (
                 <text
                    x={layout.x}
                    y={layout.y}
                    fill="#cad3f5"
                    fontSize="12"
                    textAnchor="middle"
                    dy="-4"
                 >
                    {edge.label}
                 </text>
            )}
        </g>
    );
}

export function FlowchartTracer() {
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    const [gameState, setGameState] = useState<'start' | 'running' | 'feedback' | 'finished'>('start');
    const [puzzle, setPuzzle] = useState<FlowchartTrial | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
    const [feedback, setFeedback] = useState('');

    const trialStartTime = useRef(0);
    const trialCount = useRef(0);
    const prngRef = useRef<PRNG | null>(null);
    const adaptiveState = getAdaptiveState(GAME_ID, 'logic');

    const startNewTrial = useCallback(() => {
        if (!prngRef.current) return;
        const newPuzzle = generateGvLogicTrial(adaptiveState.currentLevel, prngRef.current);
        setPuzzle(newPuzzle);
        setGameState('running');
        trialStartTime.current = Date.now();
        setSelectedAnswer(null);
        setFeedback('');
    }, [adaptiveState]);

    const startNewSession = useCallback(() => {
        prngRef.current = new PRNG(crypto.randomUUID());
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'logic', sessionState);
        trialCount.current = 0;
        startNewTrial();
    }, [adaptiveState, startNewTrial, updateAdaptiveState]);

    const handleAnswer = (answer: any) => {
        if (gameState !== 'running' || !puzzle || !activeSession) return;
        
        setGameState('feedback');
        setSelectedAnswer(answer);
        const rtMs = Date.now() - trialStartTime.current;
        const isCorrect = answer === puzzle.correctAnswer;

        if (isCorrect) {
            setFeedback('Correct!');
        } else {
            setFeedback(`Incorrect. The correct output was ${puzzle.correctAnswer}.`);
        }
        
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs: rtMs, telemetry: { nodeCount: puzzle.nodes.length, edgeCount: puzzle.edges.length } };
        logEvent({ type: 'trial_complete', sessionId: activeSession.sessionId, payload: { ...trialResult, gameId: GAME_ID, focus: 'logic' } as any });
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        updateAdaptiveState(GAME_ID, 'logic', newState);

        trialCount.current++;
        setTimeout(() => {
            if (trialCount.current >= policy.sessionLength) {
                setGameState('finished');
            } else {
                startNewTrial();
            }
        }, 2500);
    };

    if (!adaptiveState) return <Loader2 className="animate-spin" />;

    const layout = puzzle ? getLayoutedElements(
        puzzle.nodes.map(n => ({ id: n.id, width: n.type === 'decision' ? 140 : 120, height: n.type === 'decision' ? 80 : 50 })),
        puzzle.edges.map(e => ({ v: e.from, w: e.to, label: e.label }))
    ) : null;
    
    return (
        <Card className="w-full max-w-2xl text-center bg-zinc-900 border-teal-500/20 text-teal-100">
            <CardHeader>
                <CardTitle className="text-teal-300 flex items-center justify-center gap-2">
                    <Share2 /> Flowchart Tracer
                </CardTitle>
                <CardDescription className="text-teal-300/70">Mentally trace the path through the diagram to determine the final output.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 min-h-[500px] justify-center">
                {gameState === 'start' && <Button onClick={startNewSession} size="lg">Start</Button>}
                {gameState === 'finished' && <div className="text-center space-y-4"><h3 className="text-2xl font-bold">Session Finished!</h3><Button onClick={startNewSession} className="mt-4">Play Again</Button></div>}
                {(gameState === 'running' || gameState === 'feedback') && puzzle && layout && (
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="w-full flex justify-between font-mono text-teal-200 px-2">
                            <span>Trial: {trialCount.current + 1}/{policy.sessionLength}</span>
                            <span>Level: {adaptiveState.currentLevel}</span>
                        </div>
                        <p className="font-semibold text-lg">{puzzle.question}</p>
                        <div className="w-full h-96 relative bg-zinc-800/50 rounded-lg overflow-auto">
                            <svg width={layout.nodes.reduce((max, n) => Math.max(max, n.x + 60), 0)} height={layout.nodes.reduce((max, n) => Math.max(max, n.y + 30), 0)} className="absolute top-0 left-0">
                                {layout.edges.map((edge, i) => <FlowchartEdge key={i} edge={edge} layout={edge} />)}
                            </svg>
                            <div className="relative">
                                {puzzle.nodes.map(node => {
                                    const nodeLayout = layout.nodes.find(n => n.id === node.id);
                                    if(!nodeLayout) return null;
                                    return <FlowchartNode key={node.id} node={node} layout={{...nodeLayout, width: node.type === 'decision' ? 140 : 120, height: node.type === 'decision' ? 80 : 50}} />;
                                })}
                            </div>
                        </div>
                        <div className="h-8 text-lg font-bold">{feedback}</div>
                        <div className="grid grid-cols-4 gap-2">
                            {puzzle.options.map((opt, i) => (
                                <Button 
                                    key={i} 
                                    onClick={() => handleAnswer(opt)}
                                    disabled={gameState === 'feedback'}
                                    className={cn(
                                        gameState === 'feedback' && opt === puzzle.correctAnswer && "bg-green-600",
                                        gameState === 'feedback' && selectedAnswer === opt && opt !== puzzle.correctAnswer && "bg-rose-600",
                                    )}
                                >{String(opt)}</Button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
