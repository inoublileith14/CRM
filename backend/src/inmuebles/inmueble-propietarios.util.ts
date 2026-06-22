export interface InmueblePropietarioContacto {
  nombre: string;
  telf: string | null;
}

export const MAX_INMUEBLE_PROPIETARIOS = 5;

export function normalizePropietariosContactos(input: {
  propietarios_contactos?: Array<{
    nombre: string;
    telf?: string | null;
  }> | null;
  nombre_propi?: string | null;
  telf?: string | null;
}): {
  propietarios_contactos: InmueblePropietarioContacto[];
  nombre_propi: string | null;
  telf: string | null;
  propietario_id: null;
} {
  let contactos: InmueblePropietarioContacto[] = [];

  if (Array.isArray(input.propietarios_contactos)) {
    contactos = input.propietarios_contactos
      .map((item) => ({
        nombre: item.nombre?.trim() ?? '',
        telf: item.telf?.trim() || null,
      }))
      .filter((item) => item.nombre)
      .slice(0, MAX_INMUEBLE_PROPIETARIOS);
  } else if (input.nombre_propi?.trim()) {
    contactos = [
      {
        nombre: input.nombre_propi.trim(),
        telf: input.telf?.trim() || null,
      },
    ];
  }

  const first = contactos[0];

  return {
    propietarios_contactos: contactos,
    nombre_propi: first?.nombre ?? null,
    telf: first?.telf ?? null,
    propietario_id: null,
  };
}
