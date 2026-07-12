# Deploy — BarberPro SaaS

## Backend → Railway

1. Entra a railway.app y crea un proyecto nuevo
2. "Deploy from GitHub repo" → conecta la carpeta `backend/`
3. Agrega un servicio PostgreSQL (Railway lo crea automático)
4. Variables de entorno en Railway:
   ```
   DATABASE_URL=postgresql://... (Railway te la da automático)
   JWT_SECRET=barberpro_super_secret_2025
   PORT=4000
   ```
5. El `railway.json` ya está configurado — Railway corre migrations automáticamente al deployar
6. Copia la URL del backend (ej: `https://barberpro-backend.railway.app`)

## Web → Vercel

1. Entra a vercel.com, importa el repo desde `web/`
2. Framework: Next.js (detección automática)
3. Variables de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://TU-BACKEND.railway.app/api
   ```
4. Deploy — Vercel te da URL tipo `barberpro.vercel.app`

## Primer login

Después del deploy, el seed crea:
- **Superadmin**: `superadmin@barberpro.com` / `Admin123!`
- **Admin demo**: `admin@barberia.com` / `Admin123!`

Ejecuta el seed manualmente (solo una vez):
```bash
cd backend && node src/seed.js
```

## Página pública del cliente

Cada barbería tiene su página en:
`https://tu-dominio.vercel.app/[slug]`

Ejemplo: `https://barberpro.vercel.app/barberia-el-estilo`

Los clientes pueden ver servicios y agendar citas sin necesidad de cuenta.
