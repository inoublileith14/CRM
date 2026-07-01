import { InmueblesPageContent } from '@/components/InmueblesPageContent';

export default function PisosVendidosPage() {
  return (
    <InmueblesPageContent
      tipoOperacion="venta"
      title="PISOS DESACTIVADOS VENTA"
      description="Inmuebles en venta dados de baja (OFF / no activos)."
      basePath="/dashboard/casas-venta"
      activoFilter={false}
      storageScope="venta-vendidos"
      emptyListMessage="No hay pisos desactivados en venta."
    />
  );
}

