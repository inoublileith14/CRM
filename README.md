# Cocount — Gestión Inmobiliaria

Sistema con **Next.js** (frontend), **NestJS** (API) y **Supabase** (base de datos + autenticación).

## Flujo de autenticación

```
Next.js (/api/auth/*) → NestJS (/auth/*) → Supabase Auth + tabla profiles
```

- El login valida credenciales con **Supabase Auth** (`signInWithPassword`)
- El perfil del usuario se lee de la tabla **`profiles`** en Supabase
- NestJS emite un **JWT** propio para las sesiones del frontend

## Configuración Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta `supabase/schema.sql` en **SQL Editor**
3. Copia URL, anon key y service role key desde **Settings → API**

### Variables de entorno

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

**backend/.env** (añade tus claves Supabase):

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=tu-secreto-seguro
ADMIN_EMAIL=admin@cocount.com
ADMIN_PASSWORD=Cocount
```

Al arrancar el backend, se crea automáticamente el admin en Supabase Auth y en `profiles`.

## Ejecutar

```bash
# Terminal 1 — API (puerto 3001)
cd backend
npm run start:dev

# Terminal 2 — Frontend (puerto 3000)
cd frontend
npm run dev
```

## Credenciales por defecto

| Campo      | Valor               |
|------------|---------------------|
| Correo     | `admin@cocount.com` |
| Contraseña | `Cocount`           |

## Endpoints NestJS

| Método | Ruta                    | Descripción                              |
|--------|-------------------------|------------------------------------------|
| POST   | `/auth/login`           | Login vía Supabase + JWT                 |
| POST   | `/auth/register`        | Registro de nuevo usuario + JWT          |
| POST   | `/auth/logout`          | Cerrar sesión                            |
| POST   | `/auth/forgot-password` | Envía enlace de recuperación por correo  |
| POST   | `/auth/reset-password`  | Establece nueva contraseña con token     |
| GET    | `/auth/me`              | Usuario actual (Bearer JWT)              |

### Recuperar contraseña

1. Usuario va a `/recuperar-contraseña` e introduce su correo
2. Supabase envía un email con enlace a `/restablecer-contraseña`
3. El usuario define su nueva contraseña

En Supabase → **Authentication → URL Configuration**, añade `http://localhost:3000/restablecer-contraseña` a **Redirect URLs**.

## Toasts en el login (frontend)

El login muestra notificaciones para:

- Sesión requerida / expirada
- Validación de correo y contraseña
- Carga mientras verifica credenciales
- Éxito con nombre de bienvenida
- Credenciales incorrectas
- Correo no confirmado
- Demasiados intentos
- Perfil no encontrado en Supabase
- Supabase o backend no disponible
- Errores de red y servidor
