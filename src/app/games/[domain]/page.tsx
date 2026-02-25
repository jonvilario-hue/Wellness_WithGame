
'use client';

import { useParams, notFound } from 'next/navigation';
import type { CHCDomain } from '@/types';
import { chcDomains } from '@/lib/domain-constants';
import { GameDetailPage } from '@/components/game-detail/game-detail-page';

export default function GameDetail() {
  const params = useParams();
  const domain = params.domain as CHCDomain;
  const domainInfo = chcDomains.find(d => d.key === domain);

  if (!domainInfo) {
    notFound();
  }

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <GameDetailPage domainInfo={domainInfo} />
    </main>
  );
}
