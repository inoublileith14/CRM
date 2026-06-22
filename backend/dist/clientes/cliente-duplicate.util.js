"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeClienteTelefono = normalizeClienteTelefono;
exports.clienteContactDateKey = clienteContactDateKey;
exports.buildClienteDuplicateKey = buildClienteDuplicateKey;
exports.contactDayUtcRange = contactDayUtcRange;
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
//# sourceMappingURL=cliente-duplicate.util.js.map