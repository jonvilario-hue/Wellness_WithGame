
'use client';

import type { TrainingFocus } from '@/types';
import { Brain, Music, MessageSquare, View, Smile, Share2 } from 'lucide-react';
import { SigmaIcon } from '@/components/icons';

export const FOCUS_MODE_META: Record<TrainingFocus, { Icon: React.ElementType; label: string }> = {
  neutral: { Icon: Brain, label: 'Core' },
  math: { Icon: SigmaIcon, label: 'Math' },
  music: { Icon: Music, label: 'Music' },
  verbal: { Icon: MessageSquare, label: 'Verbal' },
  spatial: { Icon: View, label: 'Spatial' },
  eq: { Icon: Smile, label: 'EQ' },
  logic: { Icon: Share2, label: 'Logic' }
};
