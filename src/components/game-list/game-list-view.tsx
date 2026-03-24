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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chcDomains.map((domain) => (
          <GameCard key={domain.key} domain={domain} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
