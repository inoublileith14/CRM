export interface InmueblePropietarioContacto {
  nombre: string;
  telf: string | null;
}

export const MAX_INMUEBLE_PROPIETARIOS = 5;

export function getInmueblePropietarios(inmueble: {
  propietarios_contactos?: InmueblePropietarioContacto[] | null;
  nombre_propi?: string | null;
  telf?: string | null;
}): InmueblePropietarioContacto[] {
  if (Array.isArray(inmueble.propietarios_contactos)) {
    return inmueble.propietarios_contactos
      .map((item) => ({
        nombre: item.nombre?.trim() ?? '',
        telf: item.telf?.trim() || null,
      }))
      .filter((item) => item.nombre);
  }

  if (inmueble.nombre_propi?.trim()) {
    return [
      {
        nombre: inmueble.nombre_propi.trim(),
        telf: inmueble.telf?.trim() || null,
      },
    ];
  }

  return [];
}

export function padPropietarioFormSlots(
  contactos: InmueblePropietarioContacto[],
): { nombre: string; telf: string }[] {
  const slots = Array.from({ length: MAX_INMUEBLE_PROPIETARIOS }, () => ({
    nombre: '',
    telf: '',
  }));

  contactos.slice(0, MAX_INMUEBLE_PROPIETARIOS).forEach((contacto, index) => {
    slots[index] = {
      nombre: contacto.nombre,
      telf: contacto.telf ?? '',
    };
  });

  return slots;
}

export function parsePropietariosFromForm(
  slots: { nombre: string; telf: string }[],
): InmueblePropietarioContacto[] {
  return slots
    .map((slot) => ({
      nombre: slot.nombre.trim(),
      telf: slot.telf.trim() || null,
    }))
    .filter((slot) => slot.nombre)
    .slice(0, MAX_INMUEBLE_PROPIETARIOS);
}
