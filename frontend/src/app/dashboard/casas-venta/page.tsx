import { InmueblesPageContent } from '@/components/InmueblesPageContent';

export default function CasasVentaPage() {
  return (
    <InmueblesPageContent
      tipoOperacion="venta"
      title="EXCEL PROPIETARIOS VENTA"
      description="Listado tipo Excel de propietarios e inmuebles en venta activos (ON)."
      basePath="/dashboard/casas-venta"
      activoFilter={true}
      storageScope="venta-activos"
      emptyListMessage="No hay inmuebles activos en venta."
    />
  );
}
