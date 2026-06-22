import { DashboardShell } from '@/components/DashboardShell';
import { QueryProvider } from '@/components/QueryProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <DashboardShell>{children}</DashboardShell>
    </QueryProvider>
  );
}
