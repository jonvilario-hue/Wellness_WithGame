
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chcDomains } from '@/types';
import { ChcDomainCard } from './chc-domain-card';
import { Gamepad2 } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';

export function AllGames() {
  const { organicGrowth } = useTheme();

  return (
    <Card className="relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
            <Gamepad2 className="w-6 h-6 text-primary" />
            All Training Games
        </CardTitle>
        <CardDescription>
            Choose a game to train a specific cognitive skill. Your global training focus is set in the header.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {chcDomains.map((domain) => (
            <ChcDomainCard key={domain.key} domain={domain} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
