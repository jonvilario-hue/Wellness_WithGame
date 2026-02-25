'use client';

import { useRouter } from 'next/navigation';
import { chcDomains } from '@/lib/domain-constants';
import { GameCard } from './game-card';
import type { CHCDomain } from '@/types';

export function GameListView() {
  const router = useRouter();

  const handleSelect = (domainKey: CHCDomain) => {
    router.push(`/games/${domainKey}`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">All Games</h1>
        <p className="text-muted-foreground">
          Select a game to view your detailed performance or start a new session.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chcDomains.map((domain) => (
          <GameCard key={domain.key} domain={domain} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
