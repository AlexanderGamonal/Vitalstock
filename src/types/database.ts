export type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  foto_url: string | null
  precio_costo: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  categoria: string | null
  fecha_venc: string | null
  activo: boolean
  destacado: boolean
  created_at: string
  updated_at: string
}

export type Feria = {
  id: string
  nombre: string
  fecha: string
  ubicacion: string | null
  costo_inscripcion: number
  costo_transporte: number
  notas: string | null
  estado: "proxima" | "en_curso" | "finalizada"
  created_at: string
  updated_at: string
}

export type FeriaProducto = {
  id: string
  feria_id: string
  producto_id: string
  cantidad_llevada: number
  cantidad_vendida: number
  precio_venta_feria: number | null
  created_at: string
  updated_at: string
  producto?: Producto
}

export type CompraProveedor = {
  id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  fecha: string
  proveedor: string | null
  notas: string | null
  created_at: string
}

export type ResumenFeria = Feria & {
  total_ingresos: number
  total_costo_productos: number
  ganancia_neta: number
  total_llevado: number
  total_vendido: number
}
