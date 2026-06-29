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
          <div className="flex min-h-screen flex-col bg-slate-50">
            <DashboardTopNav />
            <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 overflow-x-clip px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              {children}
            </main>
            <ChatbotWidget />
          </div>
        </CurrentUserProvider>
      </SupabaseSessionProvider>
    </LanguageProvider>
  );
}
