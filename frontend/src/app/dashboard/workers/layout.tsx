import { AdminOnlyGate } from '@/components/AdminOnlyGate';

export default function WorkersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminOnlyGate>{children}</AdminOnlyGate>;
}
