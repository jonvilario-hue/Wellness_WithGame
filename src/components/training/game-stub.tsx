
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers3, Cpu, AudioLines, Code, Redo } from "lucide-react";
import { Separator } from "../ui/separator";

interface GameStubProps {
    title: string;
    description: string;
    subdomain: string;
    assetComplexity: 'Low' | 'Medium' | 'High';
    fallback?: string;
}

const complexityInfo = {
    'Low': { icon: Cpu, label: 'Low (Text/2D)', color: 'bg-green-500/10 text-green-700' },
    'Medium': { icon: Layers3, label: 'Medium (2.5D/SVG)', color: 'bg-amber-500/10 text-amber-700' },
    'High': { icon: AudioLines, label: 'High (3D/Web Audio)', color: 'bg-destructive/10 text-destructive' },
};

export function GameStub({ title, description, subdomain, assetComplexity, fallback }: GameStubProps) {
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
        <Separator />
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg space-y-3">
            <div>
                <h4 className="font-bold mb-2 text-foreground flex items-center justify-center gap-2"><Code /> Implementation Prompt</h4>
                <p className="text-left">To complete this game, provide a prompt to an AI with the following goal: "Implement the '{title}' game. The user must {description.toLowerCase().replace('.', '')} by interacting with the described stimuli. The core cognitive skill being tested is '{subdomain}'."</p>
            </div>
            {fallback && (
                <div>
                    <h4 className="font-bold mb-2 text-foreground flex items-center justify-center gap-2"><Redo /> 2D Fallback Plan</h4>
                    <p className="text-left">{fallback}</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
