
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine, midiToFreq } from "@/hooks/use-audio-engine";
import { Loader2, Headphones, Brain } from "lucide-react";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus, TelemetryEvent } from "@/types";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

// --- Sub-components ---
const PianoKeyboard = ({ notePalette, onNoteClick, disabled }: { notePalette: number[], onNoteClick: (note: number) => void, disabled: boolean }) => {
    // Basic piano layout logic
    const allNotes = useMemo(() => {
        const notes = new Set<number>();
        notePalette.forEach(note => {
            notes.add(note);
            // Add accidentals if they exist
            if (![0, 5].includes(note % 12)) { // C, F have no sharp to their right in this simplified view
                 if(note + 1 <= 84) notes.add(note + 1); // Max note
            }
        });
        return Array.from(notes).sort((a,b) => a-b);
    }, [notePalette]);

    return (
        <div className="flex flex-wrap justify-center gap-1 bg-gray-800 p-2 rounded-lg">
            {allNotes.map(note => {
                const isBlackKey = [1, 3, 6, 8, 10].includes(note % 12);
                return (
                    <Button 
                        key={note} 
                        onClick={() => onNoteClick(note)} 
                        disabled={disabled} 
                        variant="outline"
                        className={cn(
                            "h-24 text-lg relative",
                            isBlackKey ? 'w-8 bg-black text-white hover:bg-gray-700 -mx-3 z-10 border-gray-600' : 'w-12 bg-white text-black hover:bg-gray-200'
                        )}
                    >
                        {/* Note label could go here */}
                    </Button>
                )
            })}
        </div>
    );
};


export function ComplexSpanTask() {
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    const { playSequence, playChord, resumeContext, isReady, getAudioContextTime, getLatencyInfo } = useAudioEngine();
    const [gameState, setGameState] = useState<'loading' | 'tutorial' | 'encoding' | 'processing' | 'recall' | 'feedback' | 'finished'>('loading');
    
    // Trial state
    const [melody, setMelody] = useState<number[]>([]);
    const [distractor, setDistractor] = useState<{ chord: number[], type: 'major' | 'minor' } | null>(null);
    const [recalledSequence, setRecalledSequence] = useState<number[]>([]);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    
    // Session state
    const trialCount = useRef(0);
    const sessionId = useRef(crypto.randomUUID());
    const deviceInfo = useRef<any>(null);

    // Timing refs
    const distractorOnsetTs = useRef(0);
    const distractorResponseRef = useRef<{correct: boolean, rt: number} | null>(null);

    const adaptiveState = useMemo(() => getAdaptiveState(GAME_ID, 'music'), [getAdaptiveState]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const info = getLatencyInfo();
        deviceInfo.current = {
            browser: navigator.userAgent,
            sampleRate: info.sampleRate,
            baseLatency: info.baseLatency,
            outputLatency: info.outputLatency,
        };
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionId.current = crypto.randomUUID();
        setGameState('encoding');
    }, [resumeContext, getLatencyInfo, adaptiveState, updateAdaptiveState]);

    const startNewTrial = useCallback(() => {
        const state = getAdaptiveState(GAME_ID, 'music');
        const level = state.currentLevel;
        const levelParams = policy.levelMap[level]?.content_config['music']?.params;

        if (!levelParams) {
            console.error("No params for music mode level", level);
            return;
        }

        // 1. Generate Melody
        const notePalette = Array.from({ length: levelParams.note_palette_size }, (_, i) => 60 + i * 2); 
        const newMelody = Array.from({ length: levelParams.melody_length }, () => notePalette[Math.floor(Math.random() * notePalette.length)]);
        setMelody(newMelody);
        setRecalledSequence([]);
        setFeedbackMessage('');

        // 2. Generate Distractor
        const isMajor = Math.random() > 0.5;
        const root = 60; // C4
        const newDistractor = {
            type: isMajor ? 'major' : 'minor' as 'major' | 'minor',
            chord: isMajor ? [root, root + 4, root + 7] : [root, root + 3, root + 7]
        };
        setDistractor(newDistractor);

        // 3. Play Encoding Sequence
        playSequence(newMelody.map(n => ({ frequency: midiToFreq(n), duration: 0.3, type: 'sine' })), 400, () => {
            setGameState('processing');
        });

    }, [getAdaptiveState, playSequence]);
    
    useEffect(() => {
        if(gameState === 'encoding') {
            startNewTrial();
        }
    }, [gameState, startNewTrial]);

    useEffect(() => {
        if(isReady && gameState === 'loading') {
            setGameState('tutorial');
        }
    }, [isReady, gameState]);
    
    useEffect(() => {
        if (gameState === 'processing' && distractor) {
            const handles = playChord(distractor.chord, 1000);
            if (handles.length > 0) {
                distractorOnsetTs.current = handles[0].scheduledOnset;
            }
        }
    }, [gameState, distractor, playChord]);

    const handleDistractorResponse = (response: 'major' | 'minor') => {
        const responseTs = getAudioContextTime();
        const distractor_rt_ms = (responseTs - distractorOnsetTs.current) * 1000;
        const distractor_correct = response === distractor?.type;
        
        distractorResponseRef.current = { correct: distractor_correct, rt: distractor_rt_ms };

        setGameState('recall');
    };
    
    const handleRecallNoteClick = (note: number) => {
        setRecalledSequence(prev => [...prev, note]);
    };

    const handleRecallSubmit = () => {
        if (!activeSession) return;
        const recall_accuracy_positional = melody.reduce((acc, note, i) => {
            return acc + (recalledSequence[i] === note ? 1 : 0);
        }, 0) / melody.length;

        // Levenshtein distance
        const dp = Array(recalledSequence.length + 1).fill(null).map(() => Array(melody.length + 1).fill(null));
        for (let i = 0; i <= recalledSequence.length; i++) dp[i][0] = i;
        for (let j = 0; j <= melody.length; j++) dp[0][j] = j;
        for (let i = 1; i <= recalledSequence.length; i++) {
            for (let j = 1; j <= melody.length; j++) {
                const cost = recalledSequence[i - 1] === melody[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
            }
        }
        const recall_edit_distance = dp[recalledSequence.length][melody.length];
        
        const isTrialCorrect = recall_accuracy_positional >= 0.8;
        setFeedbackMessage(isTrialCorrect ? "Correct!" : `Almost! The sequence was ${melody.join(', ')}`);

        const state = getAdaptiveState(GAME_ID, 'music');
        const level = state.currentLevel;
        const levelParams = policy.levelMap[level]?.content_config['music']?.params;
        const distractorPerf = distractorResponseRef.current!;

        const trialResult: TrialResult = {
            correct: isTrialCorrect,
            reactionTimeMs: 0, // Recall is untimed
            telemetry: {
                melody_length: levelParams.melody_length,
                melody_notes: melody,
                distractor_chord: distractor?.type,
                distractor_correct: distractorPerf.correct,
                distractor_rt_ms: distractorPerf.rt,
                recalled_sequence: recalledSequence,
                recall_accuracy_positional,
                recall_edit_distance,
                condition: `span_${levelParams.melody_length}`
            }
        };

        logEvent({
            type: 'trial_complete',
            sessionId: activeSession.sessionId,
            payload: {
                 id: `${activeSession.sessionId}-${trialCount.current}`,
                 sessionId: activeSession.sessionId,
                 gameId: GAME_ID,
                 focus: 'music',
                 trialIndex: trialCount.current,
                 difficultyLevel: level,
                 correct: isTrialCorrect,
                 rtMs: 0,
                 stimulusParams: trialResult.telemetry,
                 responseType: isTrialCorrect ? 'correct' : 'incorrect',
                 stimulusOnsetTs: 0,
                 responseTs: 0,
                 pausedDurationMs: 0,
                 wasFallback: false
            }
        } as Omit<TelemetryEvent, 'eventId' | 'timestamp' | 'schemaVersion' | 'seq'>);


        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);

        trialCount.current++;
        setGameState('feedback');

        setTimeout(() => {
            if (trialCount.current >= policy.sessionLength) {
                setGameState('finished');
            } else {
                setGameState('encoding');
            }
        }, 2500);
    };

    const renderContent = () => {
         if (gameState === 'loading') return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
         if (gameState === 'tutorial') {
             return <div className="text-center space-y-4">
                 <h3 className="text-xl font-semibold">Tutorial (5 trials)</h3>
                 <p>1. Listen to a short melody. <br/> 2. Identify the distractor chord. <br/> 3. Recall the original melody in order.</p>
                 <Button onClick={startNewSession}>Start</Button>
             </div>
         }
        if (gameState === 'encoding') return <div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin h-10 w-10 text-cyan-400" /><p>Memorize the melody...</p></div>
        if (gameState === 'processing') return <div className="text-center space-y-4">
            <p className="text-2xl font-semibold">What type of chord was that?</p>
            <div className="flex gap-4">
                <Button onClick={() => handleDistractorResponse('major')} size="lg" className="w-32 h-16">Major</Button>
                <Button onClick={() => handleDistractorResponse('minor')} size="lg" className="w-32 h-16">Minor</Button>
            </div>
        </div>
        if (gameState === 'recall') {
            const notePalette = policy.levelMap[adaptiveState.currentLevel]?.content_config['music']?.params.note_palette_size;
            const palette = Array.from({ length: notePalette }, (_, i) => 60 + i * 2);

            return <div className="text-center space-y-4 w-full">
                <p className="text-xl font-semibold">Recall the melody in order.</p>
                <div className="h-12 p-2 border-2 border-cyan-800 bg-cyan-900/50 rounded-md min-w-[200px] text-lg font-mono flex items-center justify-center flex-wrap gap-2">
                    {recalledSequence.map((note, i) => <span key={i}>{note}</span>)}
                </div>
                <PianoKeyboard notePalette={palette} onNoteClick={handleRecallNoteClick} disabled={false}/>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => setRecalledSequence([])} variant="secondary">Clear</Button>
                    <Button onClick={handleRecallSubmit}>Submit Recall</Button>
                </div>
            </div>
        }
        if (gameState === 'feedback') return <p className="text-2xl font-bold">{feedbackMessage}</p>
        if (gameState === 'finished') {
             return <div className="text-center space-y-4">
                 <h3 className="text-2xl font-bold">Session Complete</h3>
                 <Button onClick={startNewSession}>Play Again</Button>
             </div>
        }
    }
    
    return (
        <Card className="w-full max-w-2xl text-center bg-cyan-950 border-cyan-500/20 text-cyan-100">
            <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-cyan-500/10 rounded-md"><domainIcons.Gwm className="w-6 h-6 text-cyan-400" /></span>
                    Complex Span (Music)
                </CardTitle>
                <CardDescription className="text-cyan-300/70">
                    <Headphones className="inline-block mr-2" />
                    Memorize a melody, complete a distractor task, then recall the original melody.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    );
}

    