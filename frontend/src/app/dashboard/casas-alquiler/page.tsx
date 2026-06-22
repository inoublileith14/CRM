import { InmueblesPageContent } from '@/components/InmueblesPageContent';

export default function CasasAlquilerPage() {
  return (
    <InmueblesPageContent
      tipoOperacion="alquiler"
      title="EXCEL PROPIETARIOS ALQUILER"
      description="Listado tipo Excel de propietarios e inmuebles en alquiler."
      basePath="/dashboard/casas-alquiler"
    />
  );
}
