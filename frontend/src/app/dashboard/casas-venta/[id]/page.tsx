import { InmuebleDetailPageContent } from '@/components/InmuebleDetailPageContent';

export default function CasaVentaDetailPage() {
  return (
    <InmuebleDetailPageContent
      listPath="/dashboard/casas-venta"
      listLabel="pisos venta"
      expectedTipo="venta"
    />
  );
}
