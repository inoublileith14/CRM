export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  estado: 'activo' | 'inactivo' | 'pendiente';
  propiedades: number;
}

export interface Propietario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  inmuebles: number;
  ingresosMensuales: string;
}

export const clientes: Cliente[] = [
  {
    id: 'CL-001',
    nombre: 'María García López',
    email: 'maria.garcia@email.com',
    telefono: '+34 612 345 678',
    ciudad: 'Madrid',
    estado: 'activo',
    propiedades: 2,
  },
  {
    id: 'CL-002',
    nombre: 'Carlos Ruiz Martín',
    email: 'carlos.ruiz@email.com',
    telefono: '+34 623 456 789',
    ciudad: 'Barcelona',
    estado: 'activo',
    propiedades: 1,
  },
  {
    id: 'CL-003',
    nombre: 'Ana Fernández Soto',
    email: 'ana.fernandez@email.com',
    telefono: '+34 634 567 890',
    ciudad: 'Valencia',
    estado: 'pendiente',
    propiedades: 0,
  },
  {
    id: 'CL-004',
    nombre: 'Javier Moreno Pérez',
    email: 'javier.moreno@email.com',
    telefono: '+34 645 678 901',
    ciudad: 'Sevilla',
    estado: 'activo',
    propiedades: 3,
  },
  {
    id: 'CL-005',
    nombre: 'Lucía Torres Vega',
    email: 'lucia.torres@email.com',
    telefono: '+34 656 789 012',
    ciudad: 'Bilbao',
    estado: 'inactivo',
    propiedades: 1,
  },
  {
    id: 'CL-006',
    nombre: 'Pedro Jiménez Castro',
    email: 'pedro.jimenez@email.com',
    telefono: '+34 667 890 123',
    ciudad: 'Málaga',
    estado: 'activo',
    propiedades: 2,
  },
];

export const propietarios: Propietario[] = [
  {
    id: 'PR-001',
    nombre: 'Elena Vargas Díaz',
    email: 'elena.vargas@email.com',
    telefono: '+34 678 901 234',
    direccion: 'Calle Mayor 12, Madrid',
    inmuebles: 4,
    ingresosMensuales: '3.200 €',
  },
  {
    id: 'PR-002',
    nombre: 'Roberto Sánchez Gil',
    email: 'roberto.sanchez@email.com',
    telefono: '+34 689 012 345',
    direccion: 'Av. Diagonal 45, Barcelona',
    inmuebles: 2,
    ingresosMensuales: '1.850 €',
  },
  {
    id: 'PR-003',
    nombre: 'Isabel Romero Cruz',
    email: 'isabel.romero@email.com',
    telefono: '+34 690 123 456',
    direccion: 'Plaza del Ayuntamiento 3, Valencia',
    inmuebles: 6,
    ingresosMensuales: '5.400 €',
  },
  {
    id: 'PR-004',
    nombre: 'Miguel Herrera Blanco',
    email: 'miguel.herrera@email.com',
    telefono: '+34 601 234 567',
    direccion: 'Calle Sierpes 8, Sevilla',
    inmuebles: 1,
    ingresosMensuales: '950 €',
  },
  {
    id: 'PR-005',
    nombre: 'Carmen Ortega Rivas',
    email: 'carmen.ortega@email.com',
    telefono: '+34 612 345 670',
    direccion: 'Gran Vía 102, Bilbao',
    inmuebles: 3,
    ingresosMensuales: '2.750 €',
  },
];
