import {
  buildClienteDuplicateKey,
  normalizeClienteTelefono,
  pickUniqueClienteIdsByTelefono,
} from './cliente-duplicate.util';

const PHONE = '612345678';
const DATE = '2026-06-15T14:30:00.000Z';
const INMUEBLE_A = '11111111-1111-1111-1111-111111111111';
const INMUEBLE_B = '22222222-2222-2222-2222-222222222222';

describe('buildClienteDuplicateKey', () => {
  const keyA = buildClienteDuplicateKey(PHONE, DATE, INMUEBLE_A)!;
  const keyB = buildClienteDuplicateKey(PHONE, DATE, INMUEBLE_B)!;

  it('same phone + same property + same date → duplicate (same key)', () => {
    const other = buildClienteDuplicateKey('612345678', DATE, INMUEBLE_A);
    expect(other).toBe(keyA);
  });

  it('same phone + same property + different date → allow (different key)', () => {
    const other = buildClienteDuplicateKey(
      PHONE,
      '2026-06-16T10:00:00.000Z',
      INMUEBLE_A,
    );
    expect(other).not.toBe(keyA);
    expect(other).not.toBeNull();
  });

  it('same phone + different property + same date → allow (different key)', () => {
    expect(keyB).not.toBe(keyA);
    // Same digits after stripping non-digits (formatting only).
    expect(normalizeClienteTelefono('612 345 678')).toBe('612345678');
    expect(normalizeClienteTelefono('+34 612 345 678')).toBe('34612345678');
  });

  it('same phone + different property + different date → allow (different key)', () => {
    const other = buildClienteDuplicateKey(
      PHONE,
      '2026-06-20T09:00:00.000Z',
      INMUEBLE_B,
    );
    expect(other).not.toBe(keyA);
    expect(other).not.toBe(
      buildClienteDuplicateKey(PHONE, DATE, INMUEBLE_A),
    );
  });

  it('returns null without inmueble (no property-scoped duplicate)', () => {
    expect(buildClienteDuplicateKey(PHONE, DATE, null)).toBeNull();
    expect(buildClienteDuplicateKey(PHONE, DATE, '')).toBeNull();
  });
});

describe('pickUniqueClienteIdsByTelefono', () => {
  it('keeps one cliente per normalized phone', () => {
    const ids = pickUniqueClienteIdsByTelefono([
      { id: 'a', telefono: '612 345 678' },
      { id: 'b', telefono: '612345678' },
      { id: 'c', telefono: '699111222' },
    ]);
    expect(ids).toHaveLength(2);
    expect(ids).toContain('a');
    expect(ids).toContain('c');
    expect(ids).not.toContain('b');
  });

  it('prefers cliente already linked to target inmueble', () => {
    const ids = pickUniqueClienteIdsByTelefono(
      [
        { id: 'a', telefono: '612345678' },
        { id: 'b', telefono: '612345678' },
      ],
      { preferClienteIds: ['b'] },
    );
    expect(ids).toEqual(['b']);
  });
});
