export interface Producto {
  id: string;
  nombre: string;
  categoria: 'verduras' | 'frutas' | 'granos' | 'tuberculos' | 'cereales';
  descripcion: string;
  precio: number; // por kg o unidad
  unidad: 'kg' | 'quintal' | 'tonelada' | 'unidad' | 'docena';
  cantidadDisponible: number;
  cantidadMinima: number; // pedido mínimo

  // Información del productor
  productorId: string;
  productorNombre: string;
  ubicacion: string;

  // Detalles del producto
  variedad?: string;
  origen: string;
  fechaCosecha: Date;
  fechaVencimiento?: Date;
  certificaciones: string[]; // orgánico, fair trade, etc.

  // Estado y calidad
  estado: 'disponible' | 'agotado' | 'reservado';
  calidad: 'premium' | 'primera' | 'segunda';

  // Media
  imagenes: string[];

  // Metadata
  fechaCreacion: Date;
  fechaActualizacion: Date;
  vistas: number;
  vendido: number;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  productosCount: number;
}
