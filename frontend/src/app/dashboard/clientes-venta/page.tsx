import { InmuebleClientesGeneralPageContent } from '@/components/InmuebleClientesGeneralPageContent';

export default function ClientesGeneralVentaPage() {
  return (
    <InmuebleClientesGeneralPageContent
      expectedTipo="venta"
      inmuebleListPath="/dashboard/casas-venta"
    />
  );
}
