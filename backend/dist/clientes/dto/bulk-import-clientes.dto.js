"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkImportClientesDto = exports.BulkImportClientesOptionsDto = exports.BulkImportClienteItemDto = void 0;
class BulkImportClienteItemDto {
    nombre;
    email;
    telefono;
    ciudad;
    estado;
    origen;
    estado_contacto;
    descripcion;
    ref_cliente;
    mensaje;
    fecha_contacto;
    fecha_ultima_gestion;
    presupuesto_maximo;
    banos;
    notas;
    tipo_operacion;
    inmueble_ids;
    worker_ids;
}
exports.BulkImportClienteItemDto = BulkImportClienteItemDto;
class BulkImportClientesOptionsDto {
    inmueble_id;
    worker_id;
    tipo_operacion;
    skip_duplicates;
}
exports.BulkImportClientesOptionsDto = BulkImportClientesOptionsDto;
class BulkImportClientesDto {
    clientes;
    options;
}
exports.BulkImportClientesDto = BulkImportClientesDto;
//# sourceMappingURL=bulk-import-clientes.dto.js.map