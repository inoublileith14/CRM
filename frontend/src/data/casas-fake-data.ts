export interface Casa {
  id: string;
  direccion: string;
  barrio: string;
  precio: number;
  hab: number;
  banos: number;
  metros: number;
  amueblado: boolean;
  status: 'disponible' | 'reservado' | 'ocupado';
  imagen: string;
  propietario: string;
  telefono: string;
  observaciones?: string;
}

export const casasAlquiler: Casa[] = [
  {
    id: 'ALQ-001',
    direccion: 'Carrer de Mallorca 214, 3º 1ª',
    barrio: 'Eixample',
    precio: 1450,
    hab: 3,
    banos: 2,
    metros: 92,
    amueblado: true,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    propietario: 'María García López',
    telefono: '+34 612 345 678',
    observaciones: 'Luminoso, balcón, ascensor',
  },
  {
    id: 'ALQ-002',
    direccion: 'Passeig de Gràcia 78, 5º',
    barrio: 'Eixample',
    precio: 2200,
    hab: 4,
    banos: 2,
    metros: 120,
    amueblado: true,
    status: 'reservado',
    imagen:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    propietario: 'Carlos Ruiz Martín',
    telefono: '+34 623 456 789',
  },
  {
    id: 'ALQ-003',
    direccion: 'Carrer de Verdi 45, bajos',
    barrio: 'Gràcia',
    precio: 980,
    hab: 2,
    banos: 1,
    metros: 65,
    amueblado: false,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    propietario: 'Ana Fernández Soto',
    telefono: '+34 634 567 890',
    observaciones: 'Ideal parejas, zona tranquila',
  },
  {
    id: 'ALQ-004',
    direccion: 'Avinguda Diagonal 420, 8º 2ª',
    barrio: 'Les Corts',
    precio: 1750,
    hab: 3,
    banos: 2,
    metros: 105,
    amueblado: true,
    status: 'ocupado',
    imagen:
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    propietario: 'Javier Moreno Pérez',
    telefono: '+34 645 678 901',
  },
  {
    id: 'ALQ-005',
    direccion: 'Carrer de Provença 310, 2º',
    barrio: 'Sagrada Família',
    precio: 1350,
    hab: 2,
    banos: 1,
    metros: 78,
    amueblado: true,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    propietario: 'Lucía Torres Vega',
    telefono: '+34 656 789 012',
  },
  {
    id: 'ALQ-006',
    direccion: 'Rambla del Poblenou 88, ático',
    barrio: 'Poblenou',
    precio: 1900,
    hab: 3,
    banos: 2,
    metros: 110,
    amueblado: true,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    propietario: 'Pedro Jiménez Castro',
    telefono: '+34 667 890 123',
    observaciones: 'Terraza 25 m², vistas al mar',
  },
];

export const casasVenta: Casa[] = [
  {
    id: 'VTA-001',
    direccion: 'Carrer de Balmes 180, 4º 1ª',
    barrio: 'Eixample',
    precio: 485000,
    hab: 3,
    banos: 2,
    metros: 95,
    amueblado: false,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    propietario: 'Elena Vargas Díaz',
    telefono: '+34 678 901 234',
    observaciones: 'Reformado, parking opcional',
  },
  {
    id: 'VTA-002',
    direccion: 'Carrer de Muntaner 250, principal',
    barrio: 'Eixample',
    precio: 720000,
    hab: 4,
    banos: 3,
    metros: 140,
    amueblado: true,
    status: 'reservado',
    imagen:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    propietario: 'Roberto Sánchez Gil',
    telefono: '+34 689 012 345',
  },
  {
    id: 'VTA-003',
    direccion: 'Carrer de Lepant 120, 1º',
    barrio: 'Sant Martí',
    precio: 395000,
    hab: 2,
    banos: 1,
    metros: 72,
    amueblado: false,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    propietario: 'Isabel Romero Cruz',
    telefono: '+34 690 123 456',
    observaciones: 'Cerca metro, buena inversión',
  },
  {
    id: 'VTA-004',
    direccion: 'Carrer de Sants 400, 6º',
    barrio: 'Sants',
    precio: 310000,
    hab: 3,
    banos: 1,
    metros: 88,
    amueblado: false,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    propietario: 'Miguel Herrera Blanco',
    telefono: '+34 601 234 567',
  },
  {
    id: 'VTA-005',
    direccion: 'Passeig de Sant Joan 80, bajos',
    barrio: 'Gràcia',
    precio: 550000,
    hab: 3,
    banos: 2,
    metros: 115,
    amueblado: true,
    status: 'ocupado',
    imagen:
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    propietario: 'Carmen Ortega Rivas',
    telefono: '+34 612 345 670',
    observaciones: 'Jardín privado 40 m²',
  },
  {
    id: 'VTA-006',
    direccion: 'Avinguda Meridiana 350, 10º',
    barrio: 'Nou Barris',
    precio: 265000,
    hab: 2,
    banos: 1,
    metros: 68,
    amueblado: false,
    status: 'disponible',
    imagen:
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cd2a?w=800&q=80',
    propietario: 'María García López',
    telefono: '+34 612 345 678',
  },
];
