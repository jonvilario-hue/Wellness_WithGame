
'use client';

import { Settings, BrainCircuit, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GlobalFocusSwitcher } from './global-focus-switcher';
  
export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

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
                 <BrainCircuit className="h-7 w-7 text-primary" />
                 <h1 className="text-xl font-bold text-foreground tracking-tight hidden sm:block">PuzzleMaster</h1>
            </Link>
        </div>

        {/* Right: Navigation */}
        <nav className="flex-1 flex justify-end items-center gap-2">
             {navItems.map(({ href, label, icon: Icon }) => (
                <Button key={href} asChild variant={pathname === href ? "secondary" : "ghost"}>
                    <Link href={href} className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="hidden md:inline">{label}</span>
                    </Link>
                </Button>
            ))}
        </nav>
        
      </div>
    </header>
  );
}
