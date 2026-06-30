import { AdminOnlyGate } from '@/components/AdminOnlyGate';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminOnlyGate>{children}</AdminOnlyGate>;
}
