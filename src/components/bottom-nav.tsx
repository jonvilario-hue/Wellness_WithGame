'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Profile', icon: User },
  { href: '/games', label: 'Games', icon: LayoutGrid },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-center gap-12 px-4 sm:px-6 lg:px-8">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = (href === '/' && pathname === '/') || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group inline-flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:border-gray-400 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
