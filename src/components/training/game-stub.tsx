
'use client';

import React from 'react';
import { Wrench, MonitorSmartphone, Code, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';

interface GameStubProps {
  name: string;
  chcFactor: string;
  description: string;
  techStack: string[];
  complexity: 'Low' | 'Medium' | 'High';
  fallbackPlan: string;
  difficultyExamples?: {
    level1: string;
    level8: string;
  };
}

export const GameStub: React.FC<GameStubProps> = ({ 
  name, 
  chcFactor, 
  description, 
  techStack, 
  complexity,
  fallbackPlan,
  difficultyExamples,
}) => {
  return (
    <Card className="w-full max-w-2xl text-center border-dashed animate-in fade-in-50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{name}</CardTitle>
            <p className="text-sm text-muted-foreground font-mono mt-1">Factor: {chcFactor}</p>
          </div>
          <Badge variant={complexity === 'High' ? 'destructive' : 'secondary'}>
            Complexity: {complexity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2 text-left">
          <p className="text-foreground">{description}</p>
        </div>

        <Separator />
        
        {difficultyExamples && (
          <div className="space-y-3 text-left">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2"><ChevronsRight className="w-4 h-4"/>Difficulty Scaling</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted/50 rounded-md">
                    <p className="font-bold">Level 1 Example</p>
                    <p className="text-muted-foreground">{difficultyExamples.level1}</p>
                </div>
                 <div className="p-3 bg-muted/50 rounded-md">
                    <p className="font-bold">Level 8+ Example</p>
                    <p className="text-muted-foreground">{difficultyExamples.level8}</p>
                </div>
            </div>
          </div>
        )}

        <div className="space-y-3 text-left">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2"><Code className="w-4 h-4"/>Required Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {techStack.map(tech => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md text-left">
            <div className="flex items-center gap-2 mb-2 text-amber-700">
                <MonitorSmartphone className="w-4 h-4" />
                <h4 className="text-sm font-bold uppercase">2D Fallback Strategy</h4>
            </div>
            <p className="text-sm text-amber-900 dark:text-amber-200">
                {fallbackPlan}
            </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t justify-center">
            <Wrench className="w-3 h-3" />
            <span>Development Placeholder - Game Logic Pending</span>
        </div>

      </CardContent>
    </Card>
  );
};
