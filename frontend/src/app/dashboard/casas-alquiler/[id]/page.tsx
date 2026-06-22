import { InmuebleDetailPageContent } from '@/components/InmuebleDetailPageContent';

export default function CasaAlquilerDetailPage() {
  return (
    <InmuebleDetailPageContent
      listPath="/dashboard/casas-alquiler"
      listLabel="pisos alquiler"
      expectedTipo="alquiler"
    />
  );
}
