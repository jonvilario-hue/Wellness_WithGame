'use client';

import { Settings, Brain, Music, MessageSquare, View, Smile, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlobalFocusSwitcher } from './global-focus-switcher';
import { useTrainingFocus, type TrainingFocus } from '@/hooks/use-training-focus';
import { SigmaIcon } from './icons';
  
export function Header() {
  const pathname = usePathname();
  const { focus } = useTrainingFocus();

  const navItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const focusInfo: Record<TrainingFocus, { Icon: React.ElementType; label: string }> = {
    neutral: { Icon: Brain, label: 'Core Thinking' },
    math: { Icon: SigmaIcon, label: 'Math Reasoning' },
    music: { Icon: Music, label: 'Music Cognition' },
    verbal: { Icon: MessageSquare, label: 'Verbal Reasoning' },
    spatial: { Icon: View, label: 'Spatial Reasoning' },
    eq: { Icon: Smile, label: 'Emotional Intelligence' },
    logic: { Icon: Share2, label: 'Logic & Coding' }
  };

  const { Icon } = focusInfo[focus] || focusInfo.neutral;

  return (
    <header className="px-4 sm:px-6 md:px-8 py-2 border-b bg-card">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        
        {/* Left: Mode Switcher */}
        <div className="flex-1 flex justify-start items-center gap-1">
          <GlobalFocusSwitcher />
        </div>

        {/* Center: Branding */}
        <div className="flex-1 flex justify-center items-center">
            <Link href="/" className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring">
                 <Icon className="h-7 w-7 text-primary" />
                 <h1 className="text-xl font-bold text-foreground tracking-tight hidden sm:block">Cognitive Crucible</h1>
            </Link>
        </div>

        {/* Right: Navigation */}
        <nav className="flex-1 flex justify-end items-center gap-2">
             {navItems.map(({ href, label, icon: NavIcon }) => (
                <Button key={href} asChild variant={pathname === href ? "secondary" : "ghost"}>
                    <Link href={href} className="flex items-center gap-2">
                        <NavIcon className="h-5 w-5" />
                        <span className="hidden md:inline">{label}</span>
                    </Link>
                </Button>
            ))}
        </nav>
        
      </div>
    </header>
  );
}
