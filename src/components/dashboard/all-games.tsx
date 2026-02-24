
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChcDomainCard } from './chc-domain-card';
import { Gamepad2 } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';
import { useRouter } from 'next/navigation';
import type { CHCDomain } from '@/types';
import { DOMAIN_META } from '@/lib/domain-constants';

const allDomains = Object.keys(DOMAIN_META) as CHCDomain[];

export function AllGames() {
  const { organicGrowth } = useTheme();
  const router = useRouter();

  const handlePlay = (domainKey: CHCDomain) => {
    router.push(`/training/${domainKey}`);
  };

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
          {allDomains.map((domainKey) => (
            <ChcDomainCard key={domainKey} domain={domainKey} onPlay={handlePlay} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

