-- Origen de ingresos: renombrar valor contrato → nomina

UPDATE public.clientes
SET tipo_ingreso = 'nomina'
WHERE tipo_ingreso = 'contrato';

UPDATE public.cliente_perfiles
SET tipo_ingreso = 'nomina'
WHERE tipo_ingreso = 'contrato';
