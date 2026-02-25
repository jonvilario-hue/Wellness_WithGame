'use client';

import type { TrainingFocus } from '@/types';
import { Brain, Music, MessageSquare, View, Smile, Share2 } from 'lucide-react';
import { SigmaIcon } from '@/components/icons';

export const FOCUS_MODE_META: Record<TrainingFocus, { Icon: React.ElementType; label: string; color?: string }> = {
  neutral: { Icon: Brain, label: 'Core' },
  math: { Icon: SigmaIcon, label: 'Math', color: 'text-orange-500' },
  music: { Icon: Music, label: 'Music', color: 'text-violet-500' },
  verbal: { Icon: MessageSquare, label: 'Verbal', color: 'text-amber-500' },
  spatial: { Icon: View, label: 'Spatial', color: 'text-lime-500' },
  eq: { Icon: Smile, label: 'EQ', color: 'text-rose-500' },
  logic: { Icon: Share2, label: 'Logic', color: 'text-blue-500' }
};
