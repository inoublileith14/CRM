import { InmuebleClientesGeneralPageContent } from '@/components/InmuebleClientesGeneralPageContent';

export default function ClientesGeneralAlquilerPage() {
  return (
    <InmuebleClientesGeneralPageContent
      expectedTipo="alquiler"
      inmuebleListPath="/dashboard/casas-alquiler"
    />
  );
}
