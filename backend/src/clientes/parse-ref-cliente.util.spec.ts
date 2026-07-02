import {
  normalizeRefForMatch,
  parseRefCliente,
  refsMatchForInmueble,
} from './parse-ref-cliente.util';
import { findInmuebleIdByClienteRef } from './match-inmueble-ref.util';

describe('parseRefCliente', () => {
  it('parses alquiler rent reference with B token for banos', () => {
    const parsed = parseRefCliente('1800 4h 1b RAMBLA POBLENOU');

    expect(parsed.presupuesto).toBe('1800');
    expect(parsed.habitaciones).toBe(4);
    expect(parsed.banos).toBe(1);
    expect(parsed.zona).toBe('RAMBLA POBLENOU');
  });

  it('prefers B token over second H for banos', () => {
    const parsed = parseRefCliente('1500 3h 4b EIXAMPLE');

    expect(parsed.habitaciones).toBe(3);
    expect(parsed.banos).toBe(4);
  });

  it('parses alquiler rent reference with two H tokens and metros', () => {
    const parsed = parseRefCliente(
      '5800 3H 1H 50M RAMBLA POBLENOU SANT MARTÍ',
    );

    expect(parsed.presupuesto).toBe('5800');
    expect(parsed.habitaciones).toBe(3);
    expect(parsed.banos).toBe(1);
    expect(parsed.metros).toBe(50);
    expect(parsed.zona).toBe('RAMBLA POBLENOU SANT MARTÍ');
  });

  it('parses venta reference with k price', () => {
    const parsed = parseRefCliente('ESP 380k 2h Ferraz Arguelles');

    expect(parsed.presupuesto).toBe('380k');
    expect(parsed.habitaciones).toBe(2);
    expect(parsed.zona).toBe('Ferraz Arguelles');
  });

  it('parses venta reference with slashes', () => {
    const parsed = parseRefCliente('562k/3h/90m');

    expect(parsed.presupuesto).toBe('562k');
    expect(parsed.habitaciones).toBe(3);
    expect(parsed.metros).toBe(90);
  });
});

describe('refsMatchForInmueble', () => {
  it('matches cliente ref when it starts with inmueble ref', () => {
    expect(
      refsMatchForInmueble(
        '5800 3H 1H 50M RAMBLA POBLENOU SANT MARTÍ',
        '5800 3h 1h 50m',
      ),
    ).toBe(true);
  });

  it('matches venta refs with ESP prefix and zona', () => {
    expect(
      refsMatchForInmueble('ESP 380k 2h Ferraz', '380k 2h'),
    ).toBe(true);
  });
});

describe('findInmuebleIdByClienteRef', () => {
  it('returns the matching inmueble id', () => {
    const id = findInmuebleIdByClienteRef(
      '5800 3H 1H 50M RAMBLA POBLENOU',
      [
        {
          id: 'house-1',
          ref: '5800 3h 1h 50m',
          tipo_operacion: 'alquiler',
        },
        {
          id: 'house-2',
          ref: '6000 2h 1h 40m',
          tipo_operacion: 'alquiler',
        },
      ],
      'alquiler',
    );

    expect(id).toBe('house-1');
  });
});

describe('normalizeRefForMatch', () => {
  it('normalizes accents and spacing', () => {
    expect(normalizeRefForMatch('  ESP 380K   2H  ')).toBe('380k 2h');
  });
});
