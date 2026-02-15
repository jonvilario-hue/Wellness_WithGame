
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { Brain, Music } from 'lucide-react';
import { Separator } from '../ui/separator';
import { SigmaIcon } from '../icons';

export function TrainingSettings() {
    const { focus, setFocus, isLoaded } = useTrainingFocus();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Game Training Preferences</CardTitle>
                <CardDescription>
                    Adjust how your training sessions are configured and presented.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Training Focus</Label>
                  <p className="text-sm text-muted-foreground mb-4">Choose your primary focus to tailor the content of the games.</p>
                  <RadioGroup value={focus} onValueChange={(value) => setFocus(value as any)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <Label htmlFor="core-thinking" className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary h-full">
                             <RadioGroupItem value="neutral" id="core-thinking" className="mt-1"/>
                             <div className="space-y-1">
                                <div className="font-semibold flex items-center gap-2">
                                    <Brain className="w-5 h-5"/> Core Thinking
                                </div>
                                <p className="text-xs text-muted-foreground">Train cognitive skills with abstract, symbolic puzzles. This is the standard, cognition-first experience.</p>
                             </div>
                        </Label>
                     </div>
                     <div>
                        <Label htmlFor="math-reasoning" className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary h-full">
                             <RadioGroupItem value="math" id="math-reasoning" className="mt-1"/>
                             <div className="space-y-1">
                                <div className="font-semibold flex items-center gap-2">
                                    <SigmaIcon className="w-5 h-5"/> Math Reasoning
                                </div>
                                <p className="text-xs text-muted-foreground">Train cognitive skills and mathematical logic simultaneously with math-integrated puzzles.</p>
                             </div>
                        </Label>
                     </div>
                     <div>
                        <Label htmlFor="music-cognition" className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary h-full">
                             <RadioGroupItem value="music" id="music-cognition" className="mt-1"/>
                             <div className="space-y-1">
                                <div className="font-semibold flex items-center gap-2">
                                    <Music className="w-5 h-5"/> Music Cognition
                                </div>
                                <p className="text-xs text-muted-foreground">Train cognitive skills through auditory, rhythmic, and music theory-based challenges.</p>
                             </div>
                        </Label>
                     </div>
                  </RadioGroup>
                </div>

                <Separator />
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label htmlFor="adaptive-difficulty-switch" className="font-medium">
                       Allow Adaptive Difficulty
                       <p className="text-xs text-muted-foreground font-normal">Automatically adjust puzzle difficulty based on your performance.</p>
                    </Label>
                    <Switch
                        id="adaptive-difficulty-switch"
                        defaultChecked
                    />
                </div>
                
                <div>
                    <Label className="font-medium">Default Session Length</Label>
                    <RadioGroup defaultValue="standard" className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                            <RadioGroupItem value="short" id="short" />
                            <Label htmlFor="short">Short (~5 mins)</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                            <RadioGroupItem value="standard" id="standard" />
                            <Label htmlFor="standard">Standard (~10 mins)</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                            <RadioGroupItem value="long" id="long" />
                            <Label htmlFor="long">Long (~15 mins)</Label>
                        </div>
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>
    );
}
