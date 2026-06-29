import { AdminOnlyGate } from '@/components/AdminOnlyGate';

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminOnlyGate>{children}</AdminOnlyGate>;
}
