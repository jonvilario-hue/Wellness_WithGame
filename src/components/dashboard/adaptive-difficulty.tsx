
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdaptiveDifficultyAction } from '@/app/actions';
import type { AdaptDifficultyOutput, AdaptDifficultyInput } from '@/ai/flows';
import { SlidersHorizontal, Loader2, Wand2, Lightbulb, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chcDomains, type CHCDomain } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';

const INSIGHT_KEY = 'adaptiveDifficultyInsightDismissed';

export function AdaptiveDifficulty() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AdaptDifficultyOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFactor, setSelectedFactor] = useState<CHCDomain>('Gf');
  const [isInsightVisible, setIsInsightVisible] = useState(false);
  const [skillLevel, setSkillLevel] = useState(50);
  const { organicGrowth } = useTheme();

  useEffect(() => {
    const dismissed = localStorage.getItem(INSIGHT_KEY);
    if (dismissed !== 'true') {
      setIsInsightVisible(true);
    }
  }, []);

  useEffect(() => {
    // In a real app, you might fetch this data. Here we simulate it.
    // This pseudo-random generation ensures a consistent score for each domain.
    const keySeed = selectedFactor.charCodeAt(0) + selectedFactor.charCodeAt(1);
    const pseudoRandom = (seed: number) => {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };
    const generatedScore = Math.round(50 + ((keySeed * 13) % 40) + pseudoRandom(keySeed) * 5);
    setSkillLevel(generatedScore);
  }, [selectedFactor]);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null); 
    setError(null);
    startTransition(async () => {
      const input: AdaptDifficultyInput = { chcDomain: selectedFactor, userSkillLevel: skillLevel };
      const res = await getAdaptiveDifficultyAction(input);
      if (res) {
        setResult(res);
      } else {
        setError('Failed to get difficulty suggestion. Please try again.');
      }
    });
  };

  const handleDismissInsight = () => {
    setIsInsightVisible(false);
    localStorage.setItem(INSIGHT_KEY, 'true');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          Adaptive Difficulty
        </CardTitle>
        <CardDescription>
          Find the right puzzle difficulty based on your current skill level.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="chc-domain-select" className="text-sm font-medium text-muted-foreground">Cognitive Factor</label>
            <Select onValueChange={(value: CHCDomain) => setSelectedFactor(value)} defaultValue={selectedFactor}>
              <SelectTrigger id="chc-domain-select">
                <SelectValue placeholder="Select a factor" />
              </SelectTrigger>
              <SelectContent>
                {chcDomains.map((domain) => (
                  <SelectItem key={domain.key} value={domain.key}>{domain.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Your Current Skill Level</p>
            <p className="text-2xl font-bold text-primary">{skillLevel}</p>
          </div>
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
               <>
                <Wand2 className="mr-2 h-4 w-4" />
                Suggest Difficulty
              </>
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <Alert className="mt-4">
            <AlertTitle className="flex items-center gap-2">
              Suggested Difficulty: 
              <span className="font-bold text-primary">{result.adjustedDifficulty}</span>
            </AlertTitle>
            <AlertDescription>
              {result.reasoning}
            </AlertDescription>
          </Alert>
        )}

        {isInsightVisible && (
          <div className="p-3 bg-primary/10 rounded-lg text-center relative mt-2">
            <p className="text-sm flex items-start gap-2 pr-6">
              <Lightbulb className="w-5 h-5 mt-0.5 text-primary shrink-0" />
              <span className="text-foreground text-left"><span className="font-bold">Insight:</span> This tool automatically uses your skill score to suggest the perfect difficulty. No more guessing!</span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={handleDismissInsight}
              aria-label="Dismiss insight"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
