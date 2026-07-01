import { AdminOnlyGate } from '@/components/AdminOnlyGate';

export default function LogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminOnlyGate>{children}</AdminOnlyGate>;
}
