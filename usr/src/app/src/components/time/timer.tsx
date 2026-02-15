
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Plus, Minus, PlusCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { EditableLabel } from './editable-label';

type TimerState = {
    id: number;
    initialTime: number; // in seconds
    timeLeft: number; // in seconds
    isActive: boolean;
    label: string;
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const CircularTimerVisual = ({ progress }: { progress: number }) => {
    const radius = 110;
    const stroke = 14;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-64 h-64">
            <svg
                height="100%"
                width="100%"
                viewBox="0 0 240 240"
                className="transform -rotate-90"
            >
                <circle
                    stroke="hsl(var(--secondary))"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius + stroke / 2}
                    cy={radius + stroke / 2}
                />
                <circle
                    stroke="hsl(var(--primary))"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, strokeLinecap: 'round' }}
                    r={normalizedRadius}
                    cx={radius + stroke / 2}
                    cy={radius + stroke / 2}
                    className="transition-all duration-300"
                />
            </svg>
        </div>
    );
};


function TimerInstance({
    timer,
    updateTimer,
    removeTimer
}: {
    timer: TimerState,
    updateTimer: (id: number, newState: Partial<TimerState>) => void;
    removeTimer: (id: number) => void;
}) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timer.isActive && timer.timeLeft > 0) {
            timerRef.current = setInterval(() => {
                updateTimer(timer.id, { timeLeft: timer.timeLeft - 1 });
            }, 1000);
        } else if (timer.timeLeft <= 0 && timer.isActive) {
            updateTimer(timer.id, { isActive: false });
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timer.isActive, timer.timeLeft, timer.id, updateTimer]);

    const handleStartPause = () => {
        updateTimer(timer.id, { isActive: !timer.isActive });
    };

    const handleReset = () => {
        updateTimer(timer.id, { isActive: false, timeLeft: timer.initialTime });
    };
    
    const adjustTime = (amount: number) => {
        if(timer.isActive) return;
        const newTime = Math.max(0, timer.initialTime + amount);
        updateTimer(timer.id, { initialTime: newTime, timeLeft: newTime });
    }

    const progress = timer.initialTime > 0 ? (timer.timeLeft / timer.initialTime) * 100 : 0;

    return (
         <Card className="w-full">
            <CardContent className="pt-6 space-y-4 flex flex-col items-center">
                 <div className="flex justify-between items-center w-full">
                    <EditableLabel
                      initialValue={timer.label}
                      onSave={(newLabel) => updateTimer(timer.id, { label: newLabel })}
                      placeholder={`Timer`}
                      className="w-full"
                    />
                    <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => removeTimer(timer.id)}>
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                </div>
                 <div className="relative w-64 h-64 flex items-center justify-center">
                    <CircularTimerVisual progress={progress} />
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-mono text-7xl tracking-tighter">
                            {formatTime(timer.timeLeft)}
                        </span>
                        {!timer.isActive && (
                            <div className="flex items-center gap-2 mt-2">
                                <Button onClick={() => adjustTime(-60)} variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                                    <Minus className="w-5 h-5"/>
                                </Button>
                                <Button onClick={() => adjustTime(60)} variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                                    <Plus className="w-5 h-5"/>
                                </Button>
                            </div>
                        )}
                    </div>
                 </div>
                <div className="flex gap-4">
                  <Button onClick={handleStartPause} size="lg" className="w-32">
                    {timer.isActive ? <><Pause className="mr-2" /> Pause</> : <><Play className="mr-2" /> Start</>}
                  </Button>
                  <Button onClick={handleReset} size="lg" variant="outline" className="w-32">
                    <RotateCcw className="mr-2" /> Reset
                  </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export function Timer() {
    const [timers, setTimers] = useState<TimerState[]>([]);
    const [newTimerLabel, setNewTimerLabel] = useState('');
    const [newTimerDuration, setNewTimerDuration] = useState(300); // 5 minutes in seconds
    const nextId = useRef(1);

    const addTimer = (initialLabel?: string) => {
        setTimers(prev => {
            const existingNumbers = prev.map(t => {
                const match = t.label.match(/#(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            });
            let newNumber = 1;
            while (existingNumbers.includes(newNumber)) {
                newNumber++;
            }
            const newId = nextId.current++;
            const label = newTimerLabel || initialLabel || `Timer #${newNumber}`;
            
            return [...prev, {
                id: newId,
                initialTime: newTimerDuration,
                timeLeft: newTimerDuration,
                isActive: false,
                label
            }];
        });
        setNewTimerLabel('');
        setNewTimerDuration(300);
    };

    const removeTimer = (id: number) => {
        setTimers(prev => prev.filter(t => t.id !== id));
    };

    const updateTimer = useCallback((id: number, newState: Partial<TimerState>) => {
        setTimers(prev => prev.map(t => t.id === id ? { ...t, ...newState } : t));
    }, []);

    useEffect(() => {
        if (timers.length === 0) {
            addTimer('Timer #1');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Countdown Timer</CardTitle>
                <CardDescription>Set multiple timers for focused work sessions, breaks, or reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full border-dashed">
                            <PlusCircle className="mr-2" /> Add New Timer
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Add a New Timer</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="timer-label">Label (optional)</Label>
                                <Input id="timer-label" type="text" placeholder="e.g., Study Session" value={newTimerLabel} onChange={e => setNewTimerLabel(e.target.value)}/>
                            </div>
                            <div>
                                <Label htmlFor="timer-duration" className="flex justify-between">
                                  <span>Duration</span>
                                  <span>{newTimerDuration / 60} minutes</span>
                                </Label>
                                <Slider 
                                  id="timer-duration"
                                  min={1}
                                  max={120}
                                  step={1}
                                  value={[newTimerDuration / 60]}
                                  onValueChange={(value) => setNewTimerDuration(value[0] * 60)}
                                  className="mt-2"
                                />
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => addTimer()}>Add Timer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {timers.length === 0 && (
                     <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        Click "Add New Timer" to begin.
                    </div>
                )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {timers.map(timer => (
                        <TimerInstance 
                            key={timer.id}
                            timer={timer}
                            updateTimer={updateTimer}
                            removeTimer={removeTimer}
                        />
                    ))}
                 </div>
            </CardContent>
        </Card>
    );
}
