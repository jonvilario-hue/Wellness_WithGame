'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Lightbulb, Info } from 'lucide-react';
import { GrowthDecoration } from '../ui/growth-decoration';
import { useTheme } from '@/hooks/use-theme';
import type { TrainingFocus } from '@/types';

export function SubjectInsightCard({ subject, viewMode = 'domain' }: { subject: TrainingFocus, viewMode?: 'domain' | 'focus' }) {
    const { organicGrowth } = useTheme();

  const getInsight = () => {
    if (viewMode === 'focus') {
      return "Your scores are highest in Logic-based tasks, but lowest in modes requiring musical processing.";
    }
    if (subject === 'eq') {
      return "Your emotional speed is strong, but you sometimes confuse contempt and disgust.";
    }
    return "Your weakest area is Listening. Try the Auditory Processing Lab to improve.";
  };
  
  const renderSubjectSpecificContent = () => {
      if (viewMode === 'domain' && subject === 'eq') {
          return (
              <div className="space-y-4 mt-4">
                  <h4 className="font-semibold">EQ-Specific Breakdown</h4>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground text-center">
                    Emotion recognition accuracy, confusion pairs, and prosody sensitivity scores will appear here once you've played more EQ-mode games.
                  </div>
              </div>
          )
      }
      return null;
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
       {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Lightbulb className="w-5 h-5 text-primary" />
          Key Insight
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg italic text-center">"{getInsight()}"</p>
        {renderSubjectSpecificContent()}
      </CardContent>
    </Card>
  );
}
