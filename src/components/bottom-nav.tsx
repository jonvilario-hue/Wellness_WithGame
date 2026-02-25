
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutGrid, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/games', label: 'Games', icon: LayoutGrid },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = (href === '/' && pathname === '/') || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group inline-flex flex-col items-center justify-center px-5 text-sm",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="mb-1 h-6 w-6" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
