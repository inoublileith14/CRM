# Coconut — Guía de uso de la plataforma

Manual para el equipo (administradores y asesores). Explica cómo usar el panel de gestión inmobiliaria día a día.

**Web de producción:** [https://www.coconutluxuryflats.es](https://www.coconutluxuryflats.es)

---

## 1. ¿Qué es Coconut?

Coconut es un panel web para gestionar:

- **Inmuebles** en alquiler y en venta  
- **Clientes** interesados (contactos de Idealista y otros)  
- **Propietarios** de las viviendas  
- **Trabajadores** del equipo (cuentas con acceso al panel)

Todo se guarda en la nube (base de datos Supabase). Cada usuario entra con su email y contraseña.

---

## 2. Acceso y cuentas

### Iniciar sesión

1. Abre **https://www.coconutluxuryflats.es/login**
2. Introduce **correo** y **contraseña**
3. Pulsa **Entrar**

Si la sesión caduca, verás un aviso y tendrás que volver a iniciar sesión.

### Recuperar contraseña

1. En el login → **¿Olvidaste tu contraseña?**
2. Introduce tu email → **Enviar enlace**
3. Abre el enlace del correo
4. Elige **nueva contraseña** y confírmala

### Crear cuenta (registro público)

En **Regístrate aquí** cualquier persona puede crear una cuenta. Por defecto queda como **Asesor**.

> Si no quieres cuentas abiertas, acordad internamente quién puede registrarse o desactivad el enlace en vuestra política de uso.

### Invitación de trabajador (recomendado)

Cuando un **administrador** añade un trabajador desde el panel:

1. Se envía un email de Supabase: **"You've been invited"**
2. El trabajador pulsa **Accept invitation**
3. Debe llegar a la página **Aceptar invitación** para crear su contraseña
4. Después ya puede entrar en **Iniciar sesión**

Si el enlace abre el login en lugar del formulario de contraseña:

- Espera unos segundos (la web redirige sola a **Aceptar invitación**), o  
- Cambia manualmente la URL: sustituye `/login` por `/aceptar-invitacion` y deja todo lo que va después del `#`  
- Si el enlace expiró: en **Trabajadores** → ficha del trabajador → **Reenviar invitación**

---

## 3. Roles del equipo

| Rol | Descripción |
|-----|-------------|
| **Admin** | Administrador del sistema |
| **Asesor** | Agente / asesor comercial |

En la práctica, **ambos roles ven las mismas pantallas** (clientes, inmuebles, trabajadores, etc.). El rol se muestra en el perfil y al crear trabajadores.

### Estado de la cuenta de un trabajador

En la lista **Trabajadores**, columna **Usuario**:

| Estado | Significado |
|--------|-------------|
| **Sin usuario** | Solo existe la ficha; aún no tiene login |
| **Invitación enviada** | Email enviado; falta aceptar y poner contraseña |
| **Cuenta activa** | Ya puede entrar al panel |

---

## 4. Navegación del panel

### Menú lateral (izquierda)

| Menú | Para qué sirve |
|------|----------------|
| **Panel** | Resumen general |
| **Clientes** | Todos los contactos / leads |
| **Propietarios** | Dueños de los pisos |
| **Trabajadores** | Usuarios del equipo |
| **Casas alquiler** | Inmuebles en alquiler |
| **Casas venta** | Inmuebles en venta |

En **móvil**: pulsa el icono ☰ (**Abrir menú**) arriba a la izquierda.

### Cabecera (arriba)

- **ES / EN** — cambia idioma del menú (parte del texto sigue en español)
- **Avatar** → **Perfil**, **Ajustes**, **Cerrar sesión**
- **Coconut AI** (esquina inferior derecha) — botón con el logo; asistente en preparación (solo interfaz por ahora)

---

## 5. Flujo de trabajo recomendado

Este es el flujo habitual para un piso en alquiler o venta:

```
1. Crear o importar el INMUEBLE
        ↓
2. Importar CLIENTES de ese piso (Excel)
        ↓
3. En la ficha del inmueble: marcar GESTIÓN y NOTAS de cada cliente
        ↓
4. Asignar clientes a un TRABAJADOR del equipo
```

---

## 6. Casas alquiler y casas venta

### Listado

- **Añadir inmueble** — formulario manual (dirección, precio, habitaciones, fotos, enlaces Idealista, etc.)
- **Importar Excel** — carga muchos pisos de una vez (archivo `.xlsx` o `.xlsm`)
- **Ver clientes** — entra en la ficha del piso con la tabla de clientes
- **Editar** / **Eliminar** — iconos en cada fila

### Filtros en tablas (estilo hoja de cálculo)

En cualquier columna con icono de embudo:

- **Ordenar** ascendente / descendente  
- **Filtrar** por texto, número o fecha  
- **Filtrar por valores** (casillas)  
- **Aceptar** / **Borrar filtro**  
- Barra superior **Quitar filtros** si hay filtros activos

### Ficha del inmueble — clientes

Al pulsar **Ver clientes** verás:

1. **Tarjeta del inmueble** — foto, precio, datos del piso  
2. **Tabla de clientes** vinculados a ese piso  

**Columnas de la tabla (orden):**

| Columna | Uso |
|---------|-----|
| ☐ | Seleccionar para asignar trabajador |
| **Fecha contacto** | Cuándo contactó |
| **Nombre** | Nombre del cliente |
| **Teléfono** | Teléfono |
| **Gestión** | Estado operativo (dropdown, ver abajo) |
| **Notas** | Texto libre editable en la tabla |
| **Trabajador** | Quién lleva ese cliente |
| **Email** | Email |
| **Origen** | Email / Llamada / Otro |
| **Acciones** | Ver ficha completa del cliente |

---

## 7. Gestión (estado del cliente en el piso)

Solo en la tabla de clientes de cada inmueble. Pulsa el recuadro de color → elige opción. **Se guarda solo.**

### Alquiler — opciones

| Color / texto | Significado operativo |
|---------------|------------------------|
| **NO GESTIONANDO** | Por defecto; aún no se gestiona |
| **GESTIONANDO** | En gestión activa |
| **VISITA CONCERTADA** | Visita programada |
| **NC** | No contactado / no contesta |
| **PENDIENTE CUADRAR HORARIO / PENDIENTE DOCS** | Falta horario o documentación |

### Venta — opciones

| Color / texto | Significado operativo |
|---------------|------------------------|
| **NO GESTIONADO** | Por defecto |
| **GESTIONANDO (w)** | En gestión (worker) |
| **VISITA CONCERTADA** | Visita programada |
| **NC** | No contactado |
| **PENDIENTE CUADRAR VISITA** | Falta concertar visita |
| **YA COMPRÓ** | Cliente ya compró |

---

## 8. Notas

En la columna **Notas** de la tabla de clientes del inmueble:

1. Pulsa **Añadir notas…** o el texto existente  
2. Escribe  
3. **Enter** o clic fuera → guarda  
4. **Escape** → cancela  

No hace falta entrar en **Ver cliente** para guardar notas rápidas.

---

## 9. Asignar trabajadores a clientes

Desde la **ficha del inmueble** (recomendado):

1. Marca los clientes con la **casilla** (o selecciona todos arriba)  
2. En el desplegable **Asignar a trabajador…** elige la persona  
3. **Asignar seleccionados** → confirma  

Los clientes importados por Excel **llegan sin trabajador** (aparece **Sin asignar** en ámbar). Asignadlos después con este paso.

También puedes asignar desde **Clientes** → **Editar** → multiselección de inmuebles y trabajadores.

---

## 10. Importar clientes desde Excel

### Desde la ficha de un inmueble

- **Importar Excel** → archivo `.xls` o `.xlsx`  
- Cada fila se vincula **solo a ese piso**  
- **Sin trabajador** hasta que los asignéis  

### Desde Clientes (lista general)

- Importa clientes globales (pueden vincularse a inmuebles según el Excel)

### Columnas que reconoce el Excel

| Encabezado (ejemplos) | Campo |
|------------------------|--------|
| Origen | Origen del contacto |
| Estado / Estado contacto | Texto de estado contacto |
| Descripción | Descripción |
| Ref. cliente | Referencia |
| Usuario / Nombre | Nombre |
| Email / Correo | Email |
| Teléfono / Telf | Teléfono |
| Mensaje | Mensaje del anuncio |
| Fecha | Fecha de contacto |

### Regla de duplicados (importante)

**No se importa** una fila si ya existe un cliente con el mismo:

- **Teléfono** +  
- **Fecha de contacto** (mismo día) +  
- **Mismo inmueble**

Verás un aviso del tipo: *"X filas omitidas (mismo teléfono, fecha e inmueble)"*.

El estado interno CRM del cliente importado queda en **Pendiente**; lo que usáis en el día a día es la columna **Gestión** en la ficha del piso.

---

## 11. Importar inmuebles desde Excel

En **Casas alquiler** o **Casas venta** → **Importar Excel**

- Formatos: **`.xlsx`** o **`.xlsm`** (no `.xls` antiguo)  
- Puede crear **propietarios** automáticamente si vienen en el archivo  
- Puede subir **imágenes** embebidas en el Excel  

---

## 12. Clientes (lista global)

**Clientes** → vista de todos los contactos.

- **Añadir cliente** — formulario manual  
- **Importar Excel** — carga masiva  
- Tabla con filtros por columna  
- **Ver** / **Editar** / **Eliminar** en cada fila  

En la ficha de un cliente verás inmuebles y trabajadores vinculados, mensaje, estadísticas, etc.

**Estado CRM** (en lista global): **Activo**, **Inactivo**, **Pendiente** — distinto de la columna **Gestión** del piso.

---

## 13. Propietarios

- **Añadir propietario** — nombre, teléfono, email, notas  
- Ficha del propietario → lista de **inmuebles** que tiene  
- Al crear/editar un inmueble podéis vincular o crear propietario  

---

## 14. Trabajadores

- **Añadir trabajador** — nombre, teléfono, email (obligatorio), rol (Admin/Asesor), activo/inactivo, notas  
- Al crear se **envía invitación por email**  
- **Reenviar invitación** si no llegó o expiró  
- Filtros: Todos, Admin, Asesor, Inactivos, Sin cuenta  
- Búsqueda por nombre, email, teléfono, notas  

---

## 15. Mi perfil y ajustes

### Perfil (`/dashboard/profile`)

- Cambiar **nombre**  
- Ver **email** y **rol**  
- **Cambiar foto** / **Quitar foto** (máx. 5 MB)  

### Ajustes (`/dashboard/settings`)

- **Idioma de la interfaz**: Español / English  
  (menús y parte de etiquetas; formularios y mensajes operativos siguen mayormente en español)

---

## 16. Uso en móvil

- Menú lateral en **drawer** (☰)  
- Tablas con **scroll horizontal** — desliza para ver todas las columnas  
- Botones principales a ancho completo en pantallas pequeñas  
- El chat **Coconut AI** queda fijo abajo a la derecha  

---

## 17. Preguntas frecuentes

### No me llega el email de invitación

- Revisa **spam**  
- En **Trabajadores** → **Reenviar invitación**  
- Los emails de Supabase tienen límite de envío; en producción conviene configurar SMTP propio  

### El enlace de invitación me lleva al login

- La web debería redirigir a **Aceptar invitación**  
- Si no: cambia `/login` por `/aceptar-invitacion` en la URL (mantén el `#access_token=...`)  
- Pide un enlace nuevo si expiró (1 hora aprox.)  

### No puedo guardar un estado de Gestión

- Comprueba que las migraciones de base de datos están aplicadas (admin técnico)  
- Alquiler y venta tienen **listas de estados distintas**  

### Importé clientes y no aparecen

- Revisa si fueron **omitidos por duplicado** (toast al importar)  
- Comprueba filtros activos en la tabla (**Quitar filtros**)  

### ¿Quién puede borrar datos?

Cualquier usuario con sesión iniciada puede editar y eliminar registros. Borrar es **definitivo** (hay confirmación antes).

### Panel principal — ¿los números son reales?

El **Panel** (página de inicio) muestra un resumen con **datos de demostración** en la versión actual. Para cifras reales, usad las secciones **Clientes**, **Propietarios** y **Casas alquiler/venta**.

---

## 18. Resumen de URLs útiles

| Página | URL |
|--------|-----|
| Login | https://www.coconutluxuryflats.es/login |
| Panel | https://www.coconutluxuryflats.es/dashboard |
| Clientes | https://www.coconutluxuryflats.es/dashboard/clientes |
| Casas alquiler | https://www.coconutluxuryflats.es/dashboard/casas-alquiler |
| Casas venta | https://www.coconutluxuryflats.es/dashboard/casas-venta |
| Aceptar invitación | https://www.coconutluxuryflats.es/aceptar-invitacion |
| Recuperar contraseña | https://www.coconutluxuryflats.es/recuperar-contraseña |

---

## 19. Soporte técnico

Para incidencias de acceso, emails o despliegue, contactad con quien administra:

- **Vercel** (web y API)  
- **Supabase** (usuarios y base de datos)  
- Variables de entorno: `FRONTEND_URL`, `API_URL`, URLs de redirección en Supabase  

Documentación técnica de despliegue (equipo IT): `DEPLOY-VERCEL.md` en el repositorio del proyecto.

---

*Última actualización: junio 2026 — Coconut Luxury Flats*
