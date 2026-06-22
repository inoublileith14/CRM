"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_INMUEBLE_PROPIETARIOS = void 0;
exports.normalizePropietariosContactos = normalizePropietariosContactos;
exports.MAX_INMUEBLE_PROPIETARIOS = 5;
function normalizePropietariosContactos(input) {
    let contactos = [];
    if (Array.isArray(input.propietarios_contactos)) {
        contactos = input.propietarios_contactos
            .map((item) => ({
            nombre: item.nombre?.trim() ?? '',
            telf: item.telf?.trim() || null,
        }))
            .filter((item) => item.nombre)
            .slice(0, exports.MAX_INMUEBLE_PROPIETARIOS);
    }
    else if (input.nombre_propi?.trim()) {
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
//# sourceMappingURL=inmueble-propietarios.util.js.map