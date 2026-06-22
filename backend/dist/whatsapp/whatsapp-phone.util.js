"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWhatsAppRecipient = formatWhatsAppRecipient;
function formatWhatsAppRecipient(telefono) {
    if (!telefono)
        return null;
    const digits = telefono.replace(/\D/g, '');
    if (!digits)
        return null;
    if (/^[67]\d{8}$/.test(digits)) {
        return `34${digits}`;
    }
    return digits;
}
//# sourceMappingURL=whatsapp-phone.util.js.map