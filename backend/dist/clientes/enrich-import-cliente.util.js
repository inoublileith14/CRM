"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichClienteImportRow = enrichClienteImportRow;
const parse_ref_cliente_util_1 = require("./parse-ref-cliente.util");
function enrichClienteImportRow(raw) {
    const parsed = (0, parse_ref_cliente_util_1.parseRefCliente)(raw.ref_cliente);
    return {
        ...raw,
        presupuesto_maximo: raw.presupuesto_maximo ?? parsed.presupuesto,
        banos: raw.banos ?? parsed.banos,
        barrio: raw.barrio ?? parsed.zona,
    };
}
//# sourceMappingURL=enrich-import-cliente.util.js.map