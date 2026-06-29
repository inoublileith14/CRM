'use client';

import { useParams } from 'next/navigation';
import { ClienteAreaPageContent } from '@/components/clientes/ClienteAreaPageContent';

export default function ClienteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <ClienteAreaPageContent clienteId={id} />;
}
