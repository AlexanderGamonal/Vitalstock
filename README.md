# 🌿 VitalStock

Control de inventario para productos saludables — ferias corporativas, stock, reportes y ganancias.

**Stack:** Next.js 15 · Supabase · Tailwind CSS · TypeScript

---

## 🚀 Setup inicial

### 1. Clonar e instalar

```bash
git clone https://github.com/TU_USUARIO/vitalstock.git
cd vitalstock
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://swonqesdzcdqaxwtosxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

> La ANON KEY la encuentras en Supabase → Settings → API → `anon public`

### 3. Crear usuario en Supabase

Ve a **Supabase → Authentication → Users → Add user** y crea tu cuenta con email y contraseña.

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige automáticamente al login.

---

## 📦 Funcionalidades

- **Dashboard** — Alertas de stock bajo, ingresos, ganancias y ferias recientes
- **Productos** — CRUD completo con foto, precio costo/venta, stock mínimo y vencimiento
- **Ferias** — Crear ferias, armar canasta por producto, registrar ventas con +/−, cerrar feria y descontar stock automáticamente
- **Reportes** — Comparativa de ferias, ranking de productos por margen, desglose de costos

---

## 🗄️ Base de datos

Schema `vitalstock` en Supabase (aislado del resto del proyecto):

| Tabla | Descripción |
|---|---|
| `productos` | Catálogo de productos |
| `ferias` | Eventos/ferias |
| `feria_productos` | Canasta y ventas por feria |
| `compras_proveedor` | Historial de reposición |

**Vistas:** `v_resumen_ferias`, `v_stock_bajo`

**Funciones:** `cerrar_feria()`, `registrar_compra()`

---

## 🌐 Deploy en Vercel

```bash
npm i -g vercel
vercel
```

Agrega las variables de entorno en Vercel Dashboard → Settings → Environment Variables.

---

## 📱 Instalar como PWA (celular)

En el celular, abre la URL de Vercel en Chrome/Safari → menú → "Agregar a pantalla de inicio". Se instala como app nativa sin pasar por tiendas.
