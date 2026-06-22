import { EditInmueblePageContent } from '@/components/EditInmueblePageContent';

export default function EditCasaAlquilerPage() {
  return (
    <EditInmueblePageContent
      listPath="/dashboard/casas-alquiler"
      listLabel="casas alquiler"
      expectedTipo="alquiler"
    />
  );
}
