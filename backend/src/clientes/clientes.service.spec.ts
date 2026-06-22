import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { ClientesService } from './clientes.service';

const INMUEBLE_A = '11111111-1111-1111-1111-111111111111';
const INMUEBLE_B = '22222222-2222-2222-2222-222222222222';
const DATE = '2026-06-15T14:30:00.000Z';

type ExistingLink = {
  cliente_id: string;
  inmueble_id: string;
  clientes: {
    id: string;
    telefono: string;
    fecha_contacto: string;
  };
};

describe('ClientesService create duplicate rules', () => {
  let service: ClientesService;
  let existingLinks: ExistingLink[];

  beforeEach(async () => {
    existingLinks = [];

    const chainable = {
      eq: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'new-cliente-id' },
        error: null,
      }),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: 'new-cliente-id',
          cliente_inmuebles: [],
          cliente_workers: [],
        },
        error: null,
      }),
      in: jest.fn((_column: string, ids: string[]) =>
        Promise.resolve({
          data: existingLinks.filter((row) => ids.includes(row.inmueble_id)),
          error: null,
        }),
      ),
    };

    const supabase = {
      getAdmin: () => ({
        from: () => chainable,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    service = module.get(ClientesService);
  });

  function seedExisting(
    inmuebleId: string,
    telefono: string,
    fecha: string,
    clienteId = 'existing-id',
  ) {
    existingLinks.push({
      cliente_id: clienteId,
      inmueble_id: inmuebleId,
      clientes: { id: clienteId, telefono, fecha_contacto: fecha },
    });
  }

  it('rejects same phone + same property + same date', async () => {
    seedExisting(INMUEBLE_A, '612345678', DATE);

    await expect(
      service.create({
        nombre: 'Test',
        telefono: '612 345 678',
        fecha_contacto: DATE,
        inmueble_ids: [INMUEBLE_A],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows same phone + same property + different date', async () => {
    seedExisting(INMUEBLE_A, '612345678', DATE);

    await expect(
      service.create({
        nombre: 'Test',
        telefono: '612345678',
        fecha_contacto: '2026-06-16T10:00:00.000Z',
        inmueble_ids: [INMUEBLE_A],
      }),
    ).resolves.toBeDefined();
  });

  it('allows same phone + different property + same date', async () => {
    seedExisting(INMUEBLE_A, '612345678', DATE);

    await expect(
      service.create({
        nombre: 'Test',
        telefono: '612345678',
        fecha_contacto: DATE,
        inmueble_ids: [INMUEBLE_B],
      }),
    ).resolves.toBeDefined();
  });

  it('allows same phone + different property + different date', async () => {
    seedExisting(INMUEBLE_A, '612345678', DATE);

    await expect(
      service.create({
        nombre: 'Test',
        telefono: '612345678',
        fecha_contacto: '2026-06-20T09:00:00.000Z',
        inmueble_ids: [INMUEBLE_B],
      }),
    ).resolves.toBeDefined();
  });
});
