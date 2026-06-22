"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOAuthState = createOAuthState;
exports.verifyOAuthState = verifyOAuthState;
const crypto = __importStar(require("crypto"));
const STATE_TTL_MS = 15 * 60 * 1000;
function createOAuthState(userId, secret) {
    const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
    const sig = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64url');
    return `${payload}.${sig}`;
}
function verifyOAuthState(state, secret, userId) {
    const dot = state.indexOf('.');
    if (dot <= 0)
        return false;
    const payload = state.slice(0, dot);
    const sig = state.slice(dot + 1);
    const expected = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64url');
    if (sig.length !== expected.length)
        return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return false;
    }
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (data.userId !== userId)
            return false;
        if (typeof data.ts !== 'number')
            return false;
        if (Date.now() - data.ts > STATE_TTL_MS)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=calendar-oauth.state.js.map