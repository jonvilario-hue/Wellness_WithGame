
import type { LucideIcon } from 'lucide-react';
import { Archive, BookOpenText, BrainCircuit, Ear, Goal, MemoryStick, View, Zap } from 'lucide-react';
import type { CHCDomain } from '@/types';

export const domainIcons: Record<CHCDomain, LucideIcon> = {
  Gf: BrainCircuit,
  Gc: BookOpenText,
  Gwm: MemoryStick,
  Gs: Zap,
  Gv: View,
  Ga: Ear,
  Glr: Archive,
  EF: Goal,
};

export const CheckHexagonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="9 12 11 14 15 10" />
    </svg>
);

export const SigmaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 7H6l6 5-6 5h12" />
  </svg>
);
