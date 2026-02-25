'use client';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { TrainingFocus } from '@/types';
import { FOCUS_MODE_META } from '@/lib/mode-constants';

export function SubjectSelector({ selectedSubject, onSelectSubject }: { selectedSubject: TrainingFocus, onSelectSubject: (subject: TrainingFocus) => void }) {
  return (
    <div className="relative">
      <div className="p-1 bg-muted rounded-full flex items-center overflow-x-auto no-scrollbar">
        {Object.entries(FOCUS_MODE_META).map(([key, { label, Icon }]) => (
          <Button
            key={key}
            onClick={() => onSelectSubject(key as TrainingFocus)}
            variant={selectedSubject === key ? 'default' : 'ghost'}
            className={cn(
              "flex-1 rounded-full transition-all flex-shrink-0 flex items-center gap-2 px-4 py-2",
              selectedSubject === key && 'shadow-sm'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
