import { InmueblesPageContent } from '@/components/InmueblesPageContent';

export default function PisosAlquiladosPage() {
  return (
    <InmueblesPageContent
      tipoOperacion="alquiler"
      title="PISOS DESACTIVADOS ALQUILER"
      description="Inmuebles en alquiler dados de baja (OFF / no activos)."
      basePath="/dashboard/casas-alquiler"
      activoFilter={false}
      storageScope="alquiler-alquilados"
      emptyListMessage="No hay pisos desactivados en alquiler."
    />
  );
}
