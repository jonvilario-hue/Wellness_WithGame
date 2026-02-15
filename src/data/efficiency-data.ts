import type { LucideIcon } from 'lucide-react';
import { BrainCircuit, MemoryStick, Shuffle, Zap, Archive } from 'lucide-react';

export type ChcFactor = 'Gf' | 'Gwm' | 'EF' | 'Gs' | 'Glr';

type SubMetric = { 
  name: string;
  key: ChcFactor;
  trend: number; 
  value: number; 
  icon: LucideIcon; 
  description: string; 
};

type EfficiencyTimeframeData = {
  trend: number;
  subMetrics: SubMetric[];
  insight: string;
};

export const efficiencyData: Record<'weekly' | 'monthly' | 'overall', EfficiencyTimeframeData> = {
  weekly: {
    trend: 14,
    subMetrics: [
      { name: 'Problem-Solving Depth (Gf)', key: 'Gf', trend: 18, value: 78, icon: BrainCircuit, description: "Ability to resolve multi-step problems without hints." },
      { name: 'Working Memory Span (Gwm)', key: 'Gwm', trend: 9, value: 71, icon: MemoryStick, description: "Dynamic memory span under distraction or dual-tasking." },
      { name: 'Cognitive Switching (EF)', key: 'EF', trend: 12, value: 75, icon: Shuffle, description: "Speed and accuracy when switching between tasks." },
      { name: 'Processing Speed (Gs)', key: 'Gs', trend: 15, value: 85, icon: Zap, description: "How fast simple cognitive tasks can be done accurately." },
      { name: 'Long-Term Retrieval (Glr)', key: 'Glr', trend: 5, value: 65, icon: Archive, description: "Efficient access to stored knowledge and patterns." },
    ],
    insight: "Your gains this week were driven by better interference control during complex tasks."
  },
  monthly: {
    trend: 8,
    subMetrics: [
        { name: 'Problem-Solving Depth (Gf)', key: 'Gf', trend: 10, value: 72, icon: BrainCircuit, description: "Ability to resolve multi-step problems without hints." },
        { name: 'Working Memory Span (Gwm)', key: 'Gwm', trend: 5, value: 68, icon: MemoryStick, description: "Dynamic memory span under distraction or dual-tasking." },
        { name: 'Cognitive Switching (EF)', key: 'EF', trend: 7, value: 70, icon: Shuffle, description: "Speed and accuracy when switching between tasks." },
        { name: 'Processing Speed (Gs)', key: 'Gs', trend: 12, value: 80, icon: Zap, description: "How fast simple cognitive tasks can be done accurately." },
        { name: 'Long-Term Retrieval (Glr)', key: 'Glr', trend: 3, value: 62, icon: Archive, description: "Efficient access to stored knowledge and patterns." },
    ],
    insight: "Your monthly trend shows strong, steady growth in processing speed. Natural fluctuations are normal as you consolidate skills."
  },
  overall: {
    trend: 65,
    subMetrics: [
        { name: 'Problem-Solving Depth (Gf)', key: 'Gf', trend: 75, value: 75, icon: BrainCircuit, description: "Ability to resolve multi-step problems without hints." },
        { name: 'Working Memory Span (Gwm)', key: 'Gwm', trend: 62, value: 62, icon: MemoryStick, description: "Dynamic memory span under distraction or dual-tasking." },
        { name: 'Cognitive Switching (EF)', key: 'EF', trend: 65, value: 65, icon: Shuffle, description: "Speed and accuracy when switching between tasks." },
        { name: 'Processing Speed (Gs)', key: 'Gs', trend: 70, value: 70, icon: Zap, description: "How fast simple cognitive tasks can be done accurately." },
        { name: 'Long-Term Retrieval (Glr)', key: 'Glr', trend: 58, value: 58, icon: Archive, description: "Efficient access to stored knowledge and patterns." },
    ],
    insight: "Compared to your starting baseline, your biggest improvement has been in problem-solving depth. This is a sign of deep, structural cognitive change."
  }
};
