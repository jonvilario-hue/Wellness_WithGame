
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers3, Cpu, AudioLines } from "lucide-react";

interface GameStubProps {
    title: string;
    description: string;
    subdomain: string;
    assetComplexity: 'Low' | 'Medium' | 'High';
}

const complexityInfo = {
    'Low': { icon: Cpu, label: 'Low (Logic & Text)', color: 'bg-green-500/10 text-green-700' },
    'Medium': { icon: Layers3, label: 'Medium (2.5D/SVG)', color: 'bg-amber-500/10 text-amber-700' },
    'High': { icon: AudioLines, label: 'High (3D/Web Audio)', color: 'bg-destructive/10 text-destructive' },
};

export function GameStub({ title, description, subdomain, assetComplexity }: GameStubProps) {
  const { icon: Icon, label, color } = complexityInfo[assetComplexity];
  
  return (
    <Card className="w-full max-w-2xl text-center border-dashed animate-in fade-in-50">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-4">
            <Badge variant="secondary">Subdomain: {subdomain}</Badge>
            <Badge className={color}><Icon className="w-3 h-3 mr-1.5"/>Complexity: {label}</Badge>
        </div>
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <h4 className="font-bold mb-2 text-foreground">Implementation Prompt</h4>
            <p className="text-left">To complete this game, provide a prompt to an AI with the following goal: "Implement the '{title}' game. The user must {description.toLowerCase().replace('.', '')} by interacting with the described stimuli. The core cognitive skill being tested is '{subdomain}'."</p>
        </div>
      </CardContent>
    </Card>
  );
}
