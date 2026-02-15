'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/weak-area-recommendation.ts';
import '@/ai/flows/adaptive-difficulty-prompt.ts';
import '@/ai/flows/training-recommendation-flow.ts';
import '@/ai/flows/daily-circuit-flow.ts';
