-- ============================================================
-- VITALSTOCK - Migración inicial
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- Habilitar extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: productos
-- ============================================================
create table public.productos (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  descripcion   text,
  foto_url      text,
  precio_costo  numeric(10,2) not null check (precio_costo >= 0),
  precio_venta  numeric(10,2) not null check (precio_venta >= 0),
  stock_actual  integer not null default 0 check (stock_actual >= 0),
  stock_minimo  integer not null default 5 check (stock_minimo >= 0),
  categoria     text,
  fecha_venc    date,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TABLA: ferias
-- ============================================================
create table public.ferias (
  id                uuid primary key default uuid_generate_v4(),
  nombre            text not null,
  fecha             date not null,
  ubicacion         text,
  costo_inscripcion numeric(10,2) default 0,
  costo_transporte  numeric(10,2) default 0,
  notas             text,
  estado            text not null default 'proxima'
                      check (estado in ('proxima', 'en_curso', 'finalizada')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- TABLA: feria_productos (canasta por feria)
-- ============================================================
create table public.feria_productos (
  id              uuid primary key default uuid_generate_v4(),
  feria_id        uuid not null references public.ferias(id) on delete cascade,
  producto_id     uuid not null references public.productos(id) on delete restrict,
  cantidad_llevada integer not null default 0 check (cantidad_llevada >= 0),
  cantidad_vendida integer not null default 0 check (cantidad_vendida >= 0),
  precio_venta_feria numeric(10,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(feria_id, producto_id)
);

-- ============================================================
-- TABLA: compras_proveedor
-- ============================================================
create table public.compras_proveedor (
  id              uuid primary key default uuid_generate_v4(),
  producto_id     uuid not null references public.productos(id) on delete restrict,
  cantidad        integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null check (precio_unitario >= 0),
  fecha           date not null default current_date,
  proveedor       text,
  notas           text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_productos_updated_at
  before update on public.productos
  for each row execute function public.handle_updated_at();

create trigger trg_ferias_updated_at
  before update on public.ferias
  for each row execute function public.handle_updated_at();

create trigger trg_feria_productos_updated_at
  before update on public.feria_productos
  for each row execute function public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: cerrar feria y descontar stock
-- ============================================================
create or replace function public.cerrar_feria(p_feria_id uuid)
returns void as $$
declare
  fp record;
begin
  for fp in
    select producto_id, cantidad_vendida
    from public.feria_productos
    where feria_id = p_feria_id
  loop
    update public.productos
    set stock_actual = stock_actual - fp.cantidad_vendida
    where id = fp.producto_id;
  end loop;

  update public.ferias
  set estado = 'finalizada'
  where id = p_feria_id;
end;
$$ language plpgsql;

-- ============================================================
-- FUNCIÓN: reponer stock desde compra a proveedor
-- ============================================================
create or replace function public.registrar_compra(
  p_producto_id uuid,
  p_cantidad    integer,
  p_precio      numeric,
  p_proveedor   text default null,
  p_notas       text default null
)
returns void as $$
begin
  insert into public.compras_proveedor
    (producto_id, cantidad, precio_unitario, proveedor, notas)
  values
    (p_producto_id, p_cantidad, p_precio, p_proveedor, p_notas);

  update public.productos
  set
    stock_actual  = stock_actual + p_cantidad,
    precio_costo  = p_precio
  where id = p_producto_id;
end;
$$ language plpgsql;

-- ============================================================
-- VISTA: resumen de ferias con ganancias
-- ============================================================
create or replace view public.v_resumen_ferias as
select
  f.id,
  f.nombre,
  f.fecha,
  f.ubicacion,
  f.estado,
  f.costo_inscripcion,
  f.costo_transporte,
  coalesce(sum(fp.cantidad_vendida * fp.precio_venta_feria), 0)  as total_ingresos,
  coalesce(sum(fp.cantidad_vendida * p.precio_costo), 0)          as total_costo_productos,
  coalesce(sum(fp.cantidad_vendida * fp.precio_venta_feria), 0)
    - coalesce(sum(fp.cantidad_vendida * p.precio_costo), 0)
    - f.costo_inscripcion
    - f.costo_transporte                                           as ganancia_neta,
  coalesce(sum(fp.cantidad_llevada), 0)                           as total_llevado,
  coalesce(sum(fp.cantidad_vendida), 0)                           as total_vendido
from public.ferias f
left join public.feria_productos fp on fp.feria_id = f.id
left join public.productos p on p.id = fp.producto_id
group by f.id, f.nombre, f.fecha, f.ubicacion, f.estado,
         f.costo_inscripcion, f.costo_transporte;

-- ============================================================
-- VISTA: productos con alerta de stock bajo
-- ============================================================
create or replace view public.v_stock_bajo as
select
  id, nombre, categoria, foto_url,
  stock_actual, stock_minimo,
  (stock_minimo - stock_actual) as unidades_faltantes,
  precio_costo, precio_venta,
  fecha_venc
from public.productos
where activo = true
  and stock_actual <= stock_minimo
order by (stock_actual::float / nullif(stock_minimo, 0)) asc;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.productos          enable row level security;
alter table public.ferias             enable row level security;
alter table public.feria_productos    enable row level security;
alter table public.compras_proveedor  enable row level security;

create policy "auth_only" on public.productos
  for all using (auth.role() = 'authenticated');

create policy "auth_only" on public.ferias
  for all using (auth.role() = 'authenticated');

create policy "auth_only" on public.feria_productos
  for all using (auth.role() = 'authenticated');

create policy "auth_only" on public.compras_proveedor
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE: bucket para fotos de productos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict do nothing;

create policy "auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'productos' and auth.role() = 'authenticated'
  );

create policy "public_read" on storage.objects
  for select using (bucket_id = 'productos');
