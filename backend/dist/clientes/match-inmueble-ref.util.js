"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findInmuebleIdByClienteRef = findInmuebleIdByClienteRef;
const parse_ref_cliente_util_1 = require("./parse-ref-cliente.util");
function findInmuebleIdByClienteRef(refCliente, inmuebles, tipoOperacion) {
    if (!refCliente?.trim())
        return null;
    const candidates = inmuebles.filter((inmueble) => inmueble.tipo_operacion === tipoOperacion && inmueble.ref?.trim());
    if (candidates.length === 0)
        return null;
    const normalizedCliente = (0, parse_ref_cliente_util_1.normalizeRefForMatch)(refCliente);
    for (const inmueble of candidates) {
        if ((0, parse_ref_cliente_util_1.normalizeRefForMatch)(inmueble.ref) === normalizedCliente) {
            return inmueble.id;
        }
    }
    const byRefLength = [...candidates].sort((a, b) => (0, parse_ref_cliente_util_1.normalizeRefForMatch)(b.ref).length -
        (0, parse_ref_cliente_util_1.normalizeRefForMatch)(a.ref).length);
    for (const inmueble of byRefLength) {
        if ((0, parse_ref_cliente_util_1.refsMatchForInmueble)(refCliente, inmueble.ref)) {
            return inmueble.id;
        }
    }
    return null;
}
//# sourceMappingURL=match-inmueble-ref.util.js.map