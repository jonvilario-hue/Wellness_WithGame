'use client';

import { GameListView } from '@/components/game-list/game-list-view';

export default function Home() {
  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <GameListView />
    </main>
  );
}
