export type Locale = 'es' | 'en';

export type MessageKey =
  | 'app.brand'
  | 'app.subtitle'
  | 'nav.dashboard'
  | 'nav.clients'
  | 'nav.owners'
  | 'nav.ownersGroup'
  | 'nav.ownersRent'
  | 'nav.ownersSell'
  | 'nav.workers'
  | 'nav.users'
  | 'nav.admins'
  | 'nav.asesores'
  | 'nav.rentals'
  | 'nav.rentalsShort'
  | 'nav.rentalGroup'
  | 'nav.rentalClients'
  | 'nav.rentalClientsShort'
  | 'nav.sales'
  | 'nav.salesShort'
  | 'nav.saleGroup'
  | 'nav.saleClients'
  | 'nav.saleClientsShort'
  | 'nav.whatsapp'
  | 'nav.calendar'
  | 'nav.logout'
  | 'calendar.title'
  | 'calendar.subtitle'
  | 'calendar.connectTitle'
  | 'calendar.connectHint'
  | 'calendar.refresh'
  | 'calendar.loadingEvents'
  | 'calendar.noEvents'
  | 'calendar.openInGoogle'
  | 'calendar.viewGrid'
  | 'calendar.viewList'
  | 'calendar.viewMonth'
  | 'calendar.viewWeek'
  | 'calendar.viewDay'
  | 'calendar.today'
  | 'calendar.reconnect'
  | 'calendar.createEvent'
  | 'calendar.createHeading'
  | 'calendar.createSave'
  | 'calendar.clickToCreate'
  | 'calendar.eventCreated'
  | 'calendar.eventCreateFailed'
  | 'calendar.noEventsInRange'
  | 'calendar.eventTitle'
  | 'calendar.eventDescription'
  | 'calendar.eventLocation'
  | 'calendar.eventDate'
  | 'calendar.eventEndDate'
  | 'calendar.eventStartTime'
  | 'calendar.eventEndTime'
  | 'calendar.eventAllDay'
  | 'calendar.eventColor'
  | 'calendar.eventEdit'
  | 'calendar.eventSave'
  | 'calendar.eventCancel'
  | 'calendar.eventClose'
  | 'calendar.eventNoDescription'
  | 'calendar.eventUpdated'
  | 'calendar.eventUpdateFailed'
  | 'calendar.eventReadOnlyHint'
  | 'header.language'
  | 'header.profile'
  | 'header.settings'
  | 'profile.title'
  | 'profile.subtitle'
  | 'profile.name'
  | 'profile.email'
  | 'profile.role'
  | 'profile.changePhoto'
  | 'profile.removePhoto'
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.language'
  | 'settings.languageHint'
  | 'settings.calendar'
  | 'settings.calendarHint'
  | 'settings.calendarConnect'
  | 'settings.calendarDisconnect'
  | 'settings.calendarLinkedAs'
  | 'settings.calendarConnected'
  | 'settings.calendarError'
  | 'settings.calendarLoading'
  | 'role.admin'
  | 'role.asesor';

export const messages: Record<Locale, Record<MessageKey, string>> = {
  es: {
    'app.brand': 'COCONUT LUXURY FLATS',
    'app.subtitle': 'Gestión Inmobiliaria',
    'nav.dashboard': 'Panel',
    'nav.clients': 'Clientes',
    'nav.owners': 'Propietarios',
    'nav.ownersGroup': 'Propietarios',
    'nav.ownersRent': 'Prop. alquiler',
    'nav.ownersSell': 'Prop. venta',
    'nav.workers': 'Trabajadores',
    'nav.users': 'Usuarios',
    'nav.admins': 'Admins',
    'nav.asesores': 'Asesores',
    'nav.rentals': 'Propi alquiler',
    'nav.rentalsShort': 'Pisos',
    'nav.rentalGroup': 'Alquiler',
    'nav.rentalClients': 'Clientes alquiler',
    'nav.rentalClientsShort': 'Clientes',
    'nav.sales': 'Propi venta',
    'nav.salesShort': 'Pisos',
    'nav.saleGroup': 'Venta',
    'nav.saleClients': 'Clientes venta',
    'nav.saleClientsShort': 'Clientes',
    'nav.whatsapp': 'WhatsApp',
    'nav.calendar': 'Calendario',
    'nav.logout': 'Cerrar sesión',
    'calendar.title': 'Calendario',
    'calendar.subtitle': 'Próximas visitas y eventos de tu Google Calendar',
    'calendar.connectTitle': 'Conecta tu Google Calendar',
    'calendar.connectHint':
      'Autoriza Coconut para ver tus próximos eventos y programar visitas.',
    'calendar.refresh': 'Actualizar',
    'calendar.loadingEvents': 'Cargando eventos…',
    'calendar.noEvents': 'No hay eventos próximos en tu calendario.',
    'calendar.openInGoogle': 'Abrir en Google',
    'calendar.viewGrid': 'Calendario',
    'calendar.viewList': 'Lista',
    'calendar.viewMonth': 'Mes',
    'calendar.viewWeek': 'Semana',
    'calendar.viewDay': 'Día',
    'calendar.today': 'Hoy',
    'calendar.reconnect': 'Reconectar Google Calendar',
    'calendar.createEvent': 'Crear',
    'calendar.createHeading': 'Nuevo evento',
    'calendar.createSave': 'Crear evento',
    'calendar.clickToCreate':
      'Haz clic en un hueco del calendario o arrastra para seleccionar un rango y crear un evento.',
    'calendar.eventCreated': 'Evento creado en Google Calendar',
    'calendar.eventCreateFailed': 'No se pudo crear el evento',
    'calendar.noEventsInRange': 'No hay eventos en este periodo.',
    'calendar.eventTitle': 'Título',
    'calendar.eventDescription': 'Descripción',
    'calendar.eventLocation': 'Ubicación',
    'calendar.eventDate': 'Fecha',
    'calendar.eventEndDate': 'Fecha fin',
    'calendar.eventStartTime': 'Hora inicio',
    'calendar.eventEndTime': 'Hora fin',
    'calendar.eventAllDay': 'Todo el día',
    'calendar.eventColor': 'Color',
    'calendar.eventEdit': 'Editar',
    'calendar.eventSave': 'Guardar cambios',
    'calendar.eventCancel': 'Cancelar',
    'calendar.eventClose': 'Cerrar',
    'calendar.eventNoDescription': 'Sin descripción',
    'calendar.eventUpdated': 'Evento actualizado en Google Calendar',
    'calendar.eventUpdateFailed': 'No se pudo actualizar el evento',
    'calendar.eventReadOnlyHint':
      'Reconecta Google Calendar con permiso de escritura para editar eventos.',
    'header.language': 'Idioma',
    'header.profile': 'Perfil',
    'header.settings': 'Ajustes',
    'profile.title': 'Mi perfil',
    'profile.subtitle': 'Datos de tu cuenta',
    'profile.name': 'Nombre',
    'profile.email': 'Email',
    'profile.role': 'Rol',
    'profile.changePhoto': 'Cambiar foto',
    'profile.removePhoto': 'Quitar foto',
    'settings.title': 'Ajustes',
    'settings.subtitle': 'Preferencias de la aplicación',
    'settings.language': 'Idioma de la interfaz',
    'settings.languageHint': 'Solo afecta a menús y etiquetas de la UI.',
    'settings.calendar': 'Google Calendar',
    'settings.calendarHint':
      'Conecta tu cuenta para crear visitas en tu calendario desde Coconut.',
    'settings.calendarConnect': 'Conectar Google Calendar',
    'settings.calendarDisconnect': 'Desconectar',
    'settings.calendarLinkedAs': 'Conectado como',
    'settings.calendarConnected': 'Google Calendar conectado correctamente.',
    'settings.calendarError':
      'No se pudo conectar Google Calendar. Inténtalo de nuevo.',
    'settings.calendarLoading': 'Comprobando conexión…',
    'role.admin': 'Admin',
    'role.asesor': 'Asesor',
  },
  en: {
    'app.brand': 'COCONUT LUXURY FLATS',
    'app.subtitle': 'Property Management',
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.owners': 'Owners',
    'nav.ownersGroup': 'Owners',
    'nav.ownersRent': 'Owners rent',
    'nav.ownersSell': 'Owners sell',
    'nav.workers': 'Workers',
    'nav.users': 'Users',
    'nav.admins': 'Admins',
    'nav.asesores': 'Advisors',
    'nav.rentals': 'Propi rent',
    'nav.rentalsShort': 'Flats',
    'nav.rentalGroup': 'Rent',
    'nav.rentalClients': 'Rental clients',
    'nav.rentalClientsShort': 'Clients',
    'nav.sales': 'Propi sale',
    'nav.salesShort': 'Flats',
    'nav.saleGroup': 'Sale',
    'nav.saleClients': 'Sale clients',
    'nav.saleClientsShort': 'Clients',
    'nav.whatsapp': 'WhatsApp',
    'nav.calendar': 'Calendar',
    'nav.logout': 'Log out',
    'calendar.title': 'Calendar',
    'calendar.subtitle': 'Upcoming visits and events from your Google Calendar',
    'calendar.connectTitle': 'Connect your Google Calendar',
    'calendar.connectHint':
      'Authorize Coconut to view your upcoming events and schedule visits.',
    'calendar.refresh': 'Refresh',
    'calendar.loadingEvents': 'Loading events…',
    'calendar.noEvents': 'No upcoming events on your calendar.',
    'calendar.openInGoogle': 'Open in Google',
    'calendar.viewGrid': 'Calendar',
    'calendar.viewList': 'List',
    'calendar.viewMonth': 'Month',
    'calendar.viewWeek': 'Week',
    'calendar.viewDay': 'Day',
    'calendar.today': 'Today',
    'calendar.reconnect': 'Reconnect Google Calendar',
    'calendar.createEvent': 'Create',
    'calendar.createHeading': 'New event',
    'calendar.createSave': 'Create event',
    'calendar.clickToCreate':
      'Click an empty slot or drag to select a range and create an event.',
    'calendar.eventCreated': 'Event created in Google Calendar',
    'calendar.eventCreateFailed': 'Could not create the event',
    'calendar.noEventsInRange': 'No events in this period.',
    'calendar.eventTitle': 'Title',
    'calendar.eventDescription': 'Description',
    'calendar.eventLocation': 'Location',
    'calendar.eventDate': 'Date',
    'calendar.eventEndDate': 'End date',
    'calendar.eventStartTime': 'Start time',
    'calendar.eventEndTime': 'End time',
    'calendar.eventAllDay': 'All day',
    'calendar.eventColor': 'Color',
    'calendar.eventEdit': 'Edit',
    'calendar.eventSave': 'Save changes',
    'calendar.eventCancel': 'Cancel',
    'calendar.eventClose': 'Close',
    'calendar.eventNoDescription': 'No description',
    'calendar.eventUpdated': 'Event updated in Google Calendar',
    'calendar.eventUpdateFailed': 'Could not update the event',
    'calendar.eventReadOnlyHint':
      'Reconnect Google Calendar with write access to edit events.',
    'header.language': 'Language',
    'header.profile': 'Profile',
    'header.settings': 'Settings',
    'profile.title': 'My profile',
    'profile.subtitle': 'Your account details',
    'profile.name': 'Name',
    'profile.email': 'Email',
    'profile.role': 'Role',
    'profile.changePhoto': 'Change photo',
    'profile.removePhoto': 'Remove photo',
    'settings.title': 'Settings',
    'settings.subtitle': 'Application preferences',
    'settings.language': 'Interface language',
    'settings.languageHint': 'Only affects menus and UI labels.',
    'settings.calendar': 'Google Calendar',
    'settings.calendarHint':
      'Connect your account to create property visits on your calendar from Coconut.',
    'settings.calendarConnect': 'Connect Google Calendar',
    'settings.calendarDisconnect': 'Disconnect',
    'settings.calendarLinkedAs': 'Connected as',
    'settings.calendarConnected': 'Google Calendar connected successfully.',
    'settings.calendarError': 'Could not connect Google Calendar. Please try again.',
    'settings.calendarLoading': 'Checking connection…',
    'role.admin': 'Admin',
    'role.asesor': 'Advisor',
  },
};
