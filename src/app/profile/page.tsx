'use client';

import { HolisticView } from '@/components/holistic-view/holistic-view';
import { MotivationalMessage } from '@/components/motivational-message';

export default function ProfilePage() {
  return (
    <>
      <MotivationalMessage />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <HolisticView />
      </main>
    </>
  );
}
