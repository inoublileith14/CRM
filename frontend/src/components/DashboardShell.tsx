'use client';

import { ChatbotWidget } from '@/components/ChatbotWidget';
import { DashboardTopNav } from '@/components/DashboardTopNav';
import { CurrentUserProvider } from '@/contexts/CurrentUserContext';
import { SupabaseSessionProvider } from '@/contexts/SupabaseSessionContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SupabaseSessionProvider>
        <CurrentUserProvider>
          <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
            <DashboardTopNav />
            <main className="mx-auto flex min-h-0 w-full min-w-0 max-w-[1600px] flex-1 flex-col overflow-auto px-4 pb-5 pt-0 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
              {children}
            </main>
            <ChatbotWidget />
          </div>
        </CurrentUserProvider>
      </SupabaseSessionProvider>
    </LanguageProvider>
  );
}
