'use client';

import { Suspense } from 'react';
import { CalendarPageContent } from '@/components/CalendarPageContent';

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageContent />
    </Suspense>
  );
}
