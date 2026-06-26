export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cocount.es';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const HEADLINES = [
  'El CRM que piensa como tu Excel — pero en la nube',
  'Gestiona alquiler y venta sin perder un lead de Idealista',
  'Tu inmobiliaria, un solo panel: pisos, clientes, WhatsApp y equipo',
] as const;

export const SUBHEADLINES = [
  'Cocount centraliza inmuebles, contactos de Idealista, estados de gestión, propietarios y trabajadores. Importa tus Excel en segundos. Contacta clientes por WhatsApp. Coordina visitas con Google Calendar.',
  'Deja de pelear con hojas de cálculo desincronizadas. Un panel operativo para tu equipo: importación Idealista, gestión con colores y WhatsApp masivo — como ya trabajáis, pero en la nube.',
  'Nacido en una inmobiliaria de Barcelona que gestiona cientos de leads al día. Cocount digitaliza el flujo real de alquiler y venta — sin curva de aprendizaje.',
] as const;

function getHeroVariant(): 0 | 1 | 2 {
  const raw = process.env.NEXT_PUBLIC_HERO_VARIANT;
  const n = raw ? parseInt(raw, 10) : 1;
  if (n === 2) return 1;
  if (n === 3) return 2;
  return 0;
}

export function getHero() {
  const variant = getHeroVariant();
  return {
    headline: HEADLINES[variant],
    subheadline: SUBHEADLINES[variant],
    primaryCta: 'Reservar demo gratuita',
    secondaryCta: 'Ver cómo funciona',
    socialProof:
      'Usado a diario por Coconut Luxury Flats en Barcelona — ahora disponible para otras inmobiliarias.',
  };
}

export const nav = {
  tagline: 'CRM para inmobiliarias',
  links: [
    { href: '#funcionalidades', label: 'Funcionalidades' },
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#precios', label: 'Precios' },
    { href: '#faq', label: 'FAQ' },
  ],
  demoCta: 'Solicitar demo',
  loginCta: 'Iniciar sesión',
  panelCta: 'Ir al panel',
  earlyAccess: 'Early access',
};

export const painPoints = {
  title: '¿Te suena familiar?',
  items: [
    {
      title: 'Excels desincronizados',
      description:
        'Tres Excels distintos para alquiler, venta y clientes — y ninguno sincronizado.',
    },
    {
      title: 'Leads perdidos',
      description:
        'Leads de Idealista que se pierden porque nadie actualiza el estado.',
    },
    {
      title: 'WhatsApp manual',
      description:
        'WhatsApp manual uno a uno cuando hay 40 interesados en un piso.',
    },
    {
      title: 'Sin visibilidad del equipo',
      description:
        'No sabes qué asesor lleva qué cliente ni cuándo fue la última gestión.',
    },
  ],
  transition:
    'Cocount nace dentro de una inmobiliaria real. No es software genérico adaptado — es el flujo que ya usáis, digitalizado.',
};

export type FeatureStatus = 'available' | 'in_progress' | 'roadmap';

export const features = {
  title: 'Funcionalidades',
  subtitle:
    'Todo lo que tu inmobiliaria necesita para operar alquiler y venta — sin cambiar la forma en que trabajáis.',
  items: [
    {
      title: 'Alquiler y venta separados',
      description:
        'Dos pipelines en una plataforma. Listas de inmuebles, clientes, propietarios y estados de Gestión independientes para alquiler (verde) y venta (azul).',
      status: 'available' as FeatureStatus,
    },
    {
      title: 'Tablas tipo Excel',
      description:
        'Tablas densas, filtrables y ordenables por columna. Cabeceras fijas y bordes negros — la interfaz que tu equipo ya entiende. Sin curva de aprendizaje desde cero.',
      status: 'available' as FeatureStatus,
    },
    {
      title: 'Importación desde Idealista / Excel',
      description:
        'Sube exportaciones .xlsx de estadísticas Idealista. Importación asíncrona para archivos grandes (hasta 50 MB). Mapeo automático de origen, ref., email, teléfono, mensaje y fecha. Detección de duplicados por teléfono + fecha + inmueble.',
      status: 'available' as FeatureStatus,
    },
    {
      title: 'Gestión con colores',
      description:
        'Por cada vínculo cliente–inmueble, cambia el estado operativo con un clic. Colores alquiler y venta, notas inline y fecha última gestión editable. Al enviar WhatsApp, la gestión pasa a GESTIONANDO automáticamente.',
      status: 'available' as FeatureStatus,
    },
    {
      title: 'WhatsApp integrado',
      description:
        'Envío masivo de plantillas de visita desde la tabla del piso. Inbox unificado para leer y responder mensajes entrantes. Vincula conversaciones al contacto cuando el teléfono coincide. Requiere cuenta Meta Business API propia.',
      status: 'in_progress' as FeatureStatus,
    },
    {
      title: 'Google Calendar',
      description:
        'Conecta el Google Calendar de cada asesor. Consulta visitas próximas en el panel y programa citas sin cambiar de aplicación.',
      status: 'in_progress' as FeatureStatus,
    },
    {
      title: 'Equipo y asignaciones',
      description:
        'Invita trabajadores por email. Roles Admin y Asesor. Asignación masiva de clientes a asesores o inmuebles. Ves quién gestiona cada lead.',
      status: 'available' as FeatureStatus,
    },
    {
      title: 'Propietarios e inmuebles',
      description:
        'Fichas completas: refs Idealista, fotos reales/espejo, precios, m², barrio, amueblado, estado (I/P/I-M) y contactos del propietario. Importación desde Excel con imágenes embebidas.',
      status: 'available' as FeatureStatus,
      roadmap:
        'Próximamente en plan Agency: Cocount sugerirá el mejor inmueble y el mejor asesor para cada lead y podrás activar respuestas por WhatsApp basadas en los datos reales de tu inmobiliaria. Después, propondrá horarios, confirmará visitas por WhatsApp y las registrará en el panel y en Google Calendar.',
    },
  ],
};

export const howItWorks = {
  title: 'Cómo funciona',
  subtitle: 'De tu Excel a un panel operativo en cuatro pasos.',
  steps: [
    {
      title: 'Importa o crea inmuebles',
      description: 'Desde Excel o manualmente. Propietarios e imágenes incluidos.',
    },
    {
      title: 'Importa clientes de Idealista',
      description: 'Excel vinculado al piso. Duplicados detectados automáticamente.',
    },
    {
      title: 'Gestiona estados y notas',
      description: 'Colores, filtros y asignación de asesor en la tabla del inmueble.',
    },
    {
      title: 'Contacta y cierra',
      description: 'WhatsApp masivo, inbox y calendario de visitas.',
    },
  ],
};

export const comparison = {
  title: 'Excel vs CRM genérico vs Cocount',
  subtitle: 'Por qué las inmobiliarias españolas necesitan algo específico.',
  headers: ['', 'Excel', 'CRM genérico', 'Cocount'],
  rows: [
    { feature: 'Importación Idealista', excel: 'Manual', generic: 'No', cocount: true },
    { feature: 'Alquiler + venta', excel: 'Hojas separadas', generic: 'Un solo pipeline', cocount: true },
    { feature: 'Gestión por colores', excel: 'Sí pero frágil', generic: 'No', cocount: true },
    { feature: 'WhatsApp masivo', excel: 'No', generic: 'Raro', cocount: true },
    { feature: 'Curva de aprendizaje', excel: 'Ya la conoces', generic: 'Alta', cocount: 'Baja (tipo Excel)' },
  ],
};

export const pricing = {
  title: 'Precios',
  subtitle: 'Facturación mensual · IVA no incluido · Early access',
  enterpriseNote: '¿Más clientes? Contacta para plan Enterprise.',
  tiers: [
    {
      name: 'Starter',
      price: '49',
      description: 'Para inmobiliarias pequeñas que empiezan a digitalizar.',
      features: [
        'Hasta 500 clientes',
        '2 usuarios',
        'Alquiler o venta (elegir uno)',
        'Importación Excel',
        'Gestión con colores',
        'Soporte email',
      ],
      cta: 'Empezar',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '99',
      description: 'El plan más elegido por equipos de 3–5 asesores.',
      badge: 'Más popular',
      features: [
        'Hasta 2.500 clientes',
        '5 usuarios',
        'Alquiler + venta',
        'WhatsApp bulk + inbox',
        'Google Calendar',
        'Importación Excel avanzada',
        'Soporte prioritario',
      ],
      cta: 'Solicitar demo',
      highlighted: true,
    },
    {
      name: 'Agency',
      price: '199',
      description: 'Para inmobiliarias con equipo grande y alto volumen.',
      features: [
        'Hasta 10.000 clientes',
        '15 usuarios',
        'Todo lo de Pro',
        'WhatsApp IA (próximamente)',
        'Onboarding dedicado',
        'SLA respuesta 24h',
      ],
      cta: 'Solicitar demo',
      highlighted: false,
      comingSoon: 'WhatsApp IA',
    },
  ],
};

export const trust = {
  title: 'Seguridad y confianza',
  items: [
    {
      title: 'Datos en la UE',
      description: 'Datos alojados en la Unión Europea (Supabase EU).',
    },
    {
      title: 'Cifrado y acceso',
      description: 'Cifrado HTTPS · Acceso por usuario y contraseña.',
    },
    {
      title: 'Aislamiento',
      description:
        'Aislamiento por inmobiliaria (multi-tenant en despliegue).',
    },
    {
      title: 'RGPD',
      description: 'RGPD — DPA disponible para clientes B2B.',
    },
    {
      title: 'Sin permanencia',
      description: 'Sin permanencia — cancela cuando quieras.',
    },
  ],
};

export const faq = {
  title: 'Preguntas frecuentes',
  items: [
    {
      question: '¿Puedo importar mi Excel actual?',
      answer:
        'Sí. Puedes importar propiedades y clientes desde exportaciones Excel, incluidas las de estadísticas de Idealista.',
    },
    {
      question: '¿Funciona con Idealista?',
      answer:
        'Importas el Excel de estadísticas y contactos de Idealista. No requiere API oficial de Idealista.',
    },
    {
      question: '¿Alquiler y venta a la vez?',
      answer:
        'Sí. Los planes Pro y Agency incluyen pipelines separados para alquiler y venta.',
    },
    {
      question: '¿Cuántos usuarios incluye cada plan?',
      answer:
        'Starter incluye 2 usuarios, Pro 5 y Agency 15. Consulta la tabla de precios para más detalle.',
    },
    {
      question: '¿WhatsApp incluido?',
      answer:
        'El envío masivo y el inbox están en Pro y Agency. Necesitas tu propia cuenta Meta Business API.',
    },
    {
      question: '¿Mis datos están seguros?',
      answer:
        'Sí. Datos en la UE, acceso autenticado y DPA B2B disponible para clientes.',
    },
    {
      question: '¿Hay permanencia?',
      answer: 'No. Puedes cancelar cuando quieras.',
    },
    {
      question: '¿Ofrecéis demo?',
      answer:
        'Sí. Demo gratuita de 30 minutos con el fundador — te enseñamos tu flujo real con datos de ejemplo.',
    },
  ],
};

export const finalCta = {
  title: '¿Listo para dejar el caos del Excel?',
  subtitle:
    'Reserva una demo gratuita de 30 minutos — te enseñamos tu flujo real con tus datos de ejemplo.',
  submit: 'Solicitar demo',
  toastSuccess: 'Solicitud recibida. Te contactaremos en 24h.',
};

export const footer = {
  copyright: 'Cocount © 2026',
  madeIn: 'Hecho en Barcelona',
  email: 'hola@cocount.es',
  links: [
    { href: '#', label: 'Privacidad' },
    { href: '#', label: 'Términos' },
    { href: '#', label: 'DPA' },
    { href: '#', label: 'Contacto' },
  ],
  english: 'English',
};

export const statusLabels: Record<FeatureStatus, string> = {
  available: 'Disponible',
  in_progress: 'En desarrollo',
  roadmap: 'Próximamente',
};
