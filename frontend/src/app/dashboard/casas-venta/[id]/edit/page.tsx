import { EditInmueblePageContent } from '@/components/EditInmueblePageContent';

export default function EditCasaVentaPage() {
  return (
    <EditInmueblePageContent
      listPath="/dashboard/casas-venta"
      listLabel="casas venta"
      expectedTipo="venta"
    />
  );
}
