import { formatWhatsAppRecipient } from './whatsapp-phone.util';

describe('formatWhatsAppRecipient', () => {
  it('prefixes Spanish mobile numbers with 34', () => {
    expect(formatWhatsAppRecipient('612 22 65 93')).toBe('34612226593');
  });

  it('keeps numbers that already include country code', () => {
    expect(formatWhatsAppRecipient('+34 612 22 65 93')).toBe('34612226593');
  });

  it('returns null for empty values', () => {
    expect(formatWhatsAppRecipient(null)).toBeNull();
    expect(formatWhatsAppRecipient('')).toBeNull();
  });
});
