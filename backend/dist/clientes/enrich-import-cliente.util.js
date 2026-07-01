"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichClienteImportRow = enrichClienteImportRow;
const cliente_zonas_util_1 = require("./cliente-zonas.util");
const parse_ref_cliente_util_1 = require("./parse-ref-cliente.util");
function enrichClienteImportRow(raw) {
    const parsed = (0, parse_ref_cliente_util_1.parseRefCliente)(raw.ref_cliente);
    const barrio = raw.barrio != null && raw.barrio.length > 0
        ? raw.barrio
        : parsed.zona
            ? [parsed.zona]
            : [];
    return {
        ...raw,
        presupuesto_maximo: raw.presupuesto_maximo ?? parsed.presupuesto,
        banos: raw.banos ?? parsed.banos,
        barrio: (0, cliente_zonas_util_1.normalizeClienteZonas)(barrio),
    };
}
//# sourceMappingURL=enrich-import-cliente.util.js.map