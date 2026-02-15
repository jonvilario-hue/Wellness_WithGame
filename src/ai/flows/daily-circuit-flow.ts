
'use server';
/**
 * @fileOverview Defines a deterministic flow for generating a daily 3-part "Training Sequence" challenge.
 *
 * - getDailyCircuit - A function that returns a unique 3-part training circuit for the day.
 * - DailyCircuitOutput - The return type for the getDailyCircuit function.
 */

import {z} from 'zod';
import type {CHCDomain} from '@/types';
import {chcDomains} from '@/types';

const CircuitDomainEnum = z.enum(['Gf', 'Gc', 'Gwm', 'Gs', 'Gv', 'Ga', 'Glr', 'EF']);

const CircuitSegmentSchema = z.object({
  domain: CircuitDomainEnum.describe('The CHC domain for this segment.'),
  title: z
    .string()
    .describe(
      "A catchy, motivating title for the training segment (e.g., 'Logic Flow', 'Attention Filter')."
    ),
  gameTitle: z.string().describe('The specific name of the game for this segment.'),
  transferAnchor: z
    .string()
    .describe(
      "A short, compelling description of the real-world benefit of this task. Frame it as 'Helps with...'."
    ),
});

const DailyCircuitOutputSchema = z.object({
  circuitTitle: z
    .string()
    .describe(
      "An overarching, exciting title for the entire daily challenge (e.g., 'The Focus Catalyst Sequence')."
    ),
  segments: z
    .array(CircuitSegmentSchema)
    .length(3)
    .describe('An array of exactly three training segments for the daily circuit.'),
});
export type DailyCircuitOutput = z.infer<typeof DailyCircuitOutputSchema>;

// Helper to get static info for a domain
const getDomainInfo = (domainKey: CHCDomain) => {
  const domain = chcDomains.find(d => d.key === domainKey);
  return {
    name: domain?.name || 'Training',
    gameTitle: domain?.gameTitle || 'Brain Game',
    transferAnchor: domain
      ? `Helps with ${domain.description.toLowerCase().replace('.', '')}.`
      : 'Helps with cognitive skills.',
  };
};

// Deterministically selects 3 domains based on the day of the week to ensure variety.
const getTodayChallengeSet = (): CHCDomain[] => {
  const dayOfWeek = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
  const sortedDomains = [...chcDomains].sort((a, b) => (a.key < b.key ? -1 : 1)).map(d => d.key);
  return [sortedDomains[dayOfWeek % 8], sortedDomains[(dayOfWeek + 2) % 8], sortedDomains[(dayOfWeek + 4) % 8]];
};

const circuitTitles = [
    "The Focus Catalyst Sequence", "The Mental Architect Circuit", "The Cognitive Agility Drill",
    "The Neural Pathway Challenge", "The Synaptic Sprint", "The Executive Function Workout",
    "The Problem-Solver's Gauntlet"
];
const segmentTitles = {
    Gf: ["Logic Flow", "Pattern Recognition", "Abstract Reasoning"],
    Gc: ["Verbal Velocity", "Knowledge Compass", "Contextual Clarity"],
    Gwm: ["Memory Matrix", "Neural Juggler", "Dynamic Digit Span"],
    Gs: ["Synaptic Relay", "Symbol Sprint", "Rapid Code Match"],
    Gv: ["Mental Rotation", "Visual Deconstruction", "Spatial Mapping"],
    Ga: ["Auditory Filter", "Sound Sculptor", "Signal Detection"],
    Glr: ["Idea Garden", "Memory Palace Recall", "Semantic Web"],
    EF: ["Attention Filter", "Inhibition Control", "Task Switcher"]
};

export async function getDailyCircuit(): Promise<DailyCircuitOutput> {
  const selectedDomains = getTodayChallengeSet();
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  const circuitTitle = circuitTitles[dayOfYear % circuitTitles.length];

  const segments = selectedDomains.map((domainKey, index) => {
    const staticInfo = getDomainInfo(domainKey);
    const titleOptions = segmentTitles[domainKey];
    const title = titleOptions[dayOfYear % titleOptions.length];
    return {
      domain: domainKey,
      title,
      gameTitle: staticInfo.gameTitle,
      transferAnchor: staticInfo.transferAnchor,
    };
  });

  return {
    circuitTitle,
    segments: segments as [any, any, any],
  };
}
