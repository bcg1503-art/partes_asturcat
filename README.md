# Partes de Trabajo App

Aplicación web profesional para gestionar partes de trabajo con Next.js 15, TypeScript, Tailwind CSS y Supabase.

## Estructura inicial

- `app/` - rutas del App Router de Next.js
- `components/` - UI reutilizable y layout
- `lib/` - utilidades y cliente Supabase
- `hooks/` - hooks personalizados
- `types/` - tipos TypeScript compartidos
- `actions/` - acciones del servidor y autenticación
- `services/` - llamadas a Supabase y lógica de datos

## Primeros pasos

1. Configurar variables de entorno en `.env.local`
2. Ejecutar `npm install`
3. Ejecutar `npm run dev`

## Variables necesarias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. Copia la URL y la ANON KEY a `.env.local`.
3. Copia la SERVICE ROLE KEY a `.env.local`.
4. Si tienes la cadena de conexión Postgres (`DATABASE_URL`), ejecuta:

```bash
DATABASE_URL=postgres://user:pass@host:5432/postgres npm run apply-schema
```

5. Si no tienes `DATABASE_URL`, abre el SQL editor en Supabase y pega el contenido de `supabase/schema.sql` y `supabase/seeds.sql`.

## Próximo paso

Configurar las entidades de base de datos, clientes, obras y partes con CRUD.

## Despliegue en Vercel

1. Conecta tu repositorio a Vercel.
2. En el panel de proyecto, ve a Settings > Environment Variables.
3. Agrega estas variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. En Deploy Preview y Production, usa la misma configuración de entorno.
5. Ajusta el comando de build si es necesario: `npm run build`.
6. Pulsa Deploy.

> Si usas Supabase, también puedes desplegar tu base de datos con `supabase/db` y luego enlazar las mismas variables de entorno en Vercel.
