-- ============================================================
-- VITALSTOCK — Schema completo para Supabase (IDEMPOTENTE)
-- Si ya existe algo, lo recrea limpiamente.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Eliminar schema existente y recrearlo desde cero
DROP SCHEMA IF EXISTS vitalstock CASCADE;
CREATE SCHEMA vitalstock;

-- ============================================================
-- TABLAS
-- ============================================================

-- Productos
CREATE TABLE vitalstock.productos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  foto_url        TEXT,
  precio_costo    NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_venta    NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_actual    INTEGER NOT NULL DEFAULT 0,
  stock_minimo    INTEGER NOT NULL DEFAULT 1,
  categoria       TEXT,
  fecha_venc      DATE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ferias
CREATE TABLE vitalstock.ferias (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              TEXT NOT NULL,
  fecha               DATE NOT NULL,
  ubicacion           TEXT,
  costo_inscripcion   NUMERIC(10,2) NOT NULL DEFAULT 0,
  costo_transporte    NUMERIC(10,2) NOT NULL DEFAULT 0,
  notas               TEXT,
  estado              TEXT NOT NULL DEFAULT 'proxima'
                        CHECK (estado IN ('proxima', 'en_curso', 'finalizada')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feria-Productos (canasta llevada a cada feria)
CREATE TABLE vitalstock.feria_productos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feria_id            UUID NOT NULL REFERENCES vitalstock.ferias(id) ON DELETE CASCADE,
  producto_id         UUID NOT NULL REFERENCES vitalstock.productos(id) ON DELETE RESTRICT,
  cantidad_llevada    INTEGER NOT NULL DEFAULT 0,
  cantidad_vendida    INTEGER NOT NULL DEFAULT 0,
  precio_venta_feria  NUMERIC(10,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compras a proveedor (historial de reposición)
CREATE TABLE vitalstock.compras_proveedor (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id     UUID NOT NULL REFERENCES vitalstock.productos(id) ON DELETE RESTRICT,
  cantidad        INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  proveedor       TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VISTAS
-- ============================================================

-- Vista: productos con stock bajo
CREATE OR REPLACE VIEW vitalstock.v_stock_bajo AS
SELECT *
FROM vitalstock.productos
WHERE activo = TRUE
  AND stock_actual <= stock_minimo
ORDER BY (stock_actual::float / NULLIF(stock_minimo, 0)) ASC;

-- Vista: resumen de ferias con totales calculados
CREATE OR REPLACE VIEW vitalstock.v_resumen_ferias AS
SELECT
  f.*,
  COALESCE(SUM(fp.cantidad_vendida * COALESCE(fp.precio_venta_feria, p.precio_venta)), 0)  AS total_ingresos,
  COALESCE(SUM(fp.cantidad_vendida * p.precio_costo), 0)                                   AS total_costo_productos,
  COALESCE(SUM(fp.cantidad_vendida * COALESCE(fp.precio_venta_feria, p.precio_venta)), 0)
    - COALESCE(SUM(fp.cantidad_vendida * p.precio_costo), 0)
    - f.costo_inscripcion
    - f.costo_transporte                                                                    AS ganancia_neta,
  COALESCE(SUM(fp.cantidad_llevada), 0)                                                    AS total_llevado,
  COALESCE(SUM(fp.cantidad_vendida), 0)                                                    AS total_vendido
FROM vitalstock.ferias f
LEFT JOIN vitalstock.feria_productos fp ON fp.feria_id = f.id
LEFT JOIN vitalstock.productos p ON p.id = fp.producto_id
GROUP BY f.id;

-- ============================================================
-- FUNCIÓN RPC: cerrar_feria
-- ============================================================
CREATE OR REPLACE FUNCTION vitalstock.cerrar_feria(p_feria_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE vitalstock.productos p
  SET
    stock_actual = p.stock_actual - fp.cantidad_vendida,
    updated_at   = NOW()
  FROM vitalstock.feria_productos fp
  WHERE fp.feria_id    = p_feria_id
    AND fp.producto_id = p.id;

  UPDATE vitalstock.ferias
  SET estado = 'finalizada', updated_at = NOW()
  WHERE id = p_feria_id;
END;
$$;

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION vitalstock.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_productos_updated_at
  BEFORE UPDATE ON vitalstock.productos
  FOR EACH ROW EXECUTE FUNCTION vitalstock.set_updated_at();

CREATE TRIGGER trg_ferias_updated_at
  BEFORE UPDATE ON vitalstock.ferias
  FOR EACH ROW EXECUTE FUNCTION vitalstock.set_updated_at();

CREATE TRIGGER trg_feria_productos_updated_at
  BEFORE UPDATE ON vitalstock.feria_productos
  FOR EACH ROW EXECUTE FUNCTION vitalstock.set_updated_at();

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================
INSERT INTO vitalstock.productos (nombre, descripcion, precio_costo, precio_venta, stock_actual, stock_minimo, categoria)
VALUES
  ('Granola artesanal 500g',   'Con avena, miel y frutos secos',  8.00,  18.00, 15, 5, 'Cereales'),
  ('Miel de abeja pura 250ml', '100% natural, sin aditivos',      12.00, 28.00, 8,  3, 'Endulzantes'),
  ('Quinoa orgánica 1kg',      'Variedad blanca peruana',          9.00,  22.00, 20, 5, 'Granos'),
  ('Cacao en polvo 200g',      'Sin azúcar, origen Cusco',        7.00,  16.00, 2,  4, 'Superfoods');

INSERT INTO vitalstock.ferias (nombre, fecha, ubicacion, costo_inscripcion, costo_transporte, estado)
VALUES
  ('Feria Orgánica Cusco', '2025-05-10', 'Plaza San Francisco, Cusco', 50.00, 20.00, 'proxima'),
  ('Mercado Verde Abril',  '2025-04-05', 'Parque El Ejido, Cusco',     30.00, 15.00, 'finalizada');
