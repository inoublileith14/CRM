"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeClienteTelefono = normalizeClienteTelefono;
exports.clienteContactDateKey = clienteContactDateKey;
exports.buildClienteDuplicateKey = buildClienteDuplicateKey;
exports.contactDayUtcRange = contactDayUtcRange;
exports.pickUniqueClienteIdsByTelefono = pickUniqueClienteIdsByTelefono;
function normalizeClienteTelefono(telefono) {
    if (!telefono)
        return null;
    const digits = telefono.replace(/\D/g, '');
    return digits || null;
}
function clienteContactDateKey(fechaContacto) {
    if (!fechaContacto)
        return null;
    const d = new Date(fechaContacto);
    if (Number.isNaN(d.getTime()))
        return null;
    return d.toISOString().slice(0, 10);
}
function buildClienteDuplicateKey(telefono, fechaContacto, inmuebleId) {
    const phone = normalizeClienteTelefono(telefono);
    const dateKey = clienteContactDateKey(fechaContacto);
    if (!phone || !dateKey || !inmuebleId?.trim())
        return null;
    return `${phone}|${dateKey}|${inmuebleId.trim()}`;
}
function contactDayUtcRange(dateKey) {
    const dayStart = `${dateKey}T00:00:00.000Z`;
    const dayEndDate = new Date(`${dateKey}T00:00:00.000Z`);
    dayEndDate.setUTCDate(dayEndDate.getUTCDate() + 1);
    return { dayStart, dayEnd: dayEndDate.toISOString() };
}
function pickUniqueClienteIdsByTelefono(clientes, options) {
    const prefer = options?.preferClienteIds
        ? new Set(options.preferClienteIds)
        : null;
    const seenIds = new Set();
    const byPhone = new Map();
    const withoutPhone = [];
    for (const cliente of clientes) {
        if (seenIds.has(cliente.id))
            continue;
        seenIds.add(cliente.id);
        const phone = normalizeClienteTelefono(cliente.telefono);
        if (!phone) {
            withoutPhone.push(cliente.id);
            continue;
        }
        const existingId = byPhone.get(phone);
        if (!existingId) {
            byPhone.set(phone, cliente.id);
            continue;
        }
        if (prefer?.has(cliente.id) && !prefer.has(existingId)) {
            byPhone.set(phone, cliente.id);
        }
    }
    return [...withoutPhone, ...byPhone.values()];
}
//# sourceMappingURL=cliente-duplicate.util.js.map