
'use client';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { Subject } from './holistic-view';

const subjects: { key: Subject, label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'eq', label: 'EQ' },
];

export function SubjectSelector({ selectedSubject, onSelectSubject }: { selectedSubject: Subject, onSelectSubject: (subject: Subject) => void }) {
  return (
    <div className="p-1 bg-muted rounded-full flex items-center">
      {subjects.map(subject => (
        <Button
          key={subject.key}
          onClick={() => onSelectSubject(subject.key)}
          variant={selectedSubject === subject.key ? 'default' : 'ghost'}
          className={cn(
            "flex-1 rounded-full transition-all",
            selectedSubject === subject.key && 'shadow-sm'
          )}
        >
          {subject.label}
        </Button>
      ))}
       <Button variant="ghost" className="flex-1 rounded-full" disabled>Music</Button>
       <Button variant="ghost" className="flex-1 rounded-full" disabled>Academic</Button>
    </div>
  );
}
