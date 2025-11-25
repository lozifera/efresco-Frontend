export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  tipo: 'productor' | 'comprador';
  ubicacion: {
    departamento: string;
    ciudad: string;
    direccion?: string;
  };
  verificado: boolean;
  fechaRegistro: Date;
  ultimaConexion?: Date;
}

export interface Productor extends User {
  tipo: 'productor';
  finca: {
    nombre: string;
    hectareas: number;
    certificaciones: string[];
    productos: string[];
  };
  calificacion: number;
  ventasCompletadas: number;
}

export interface Comprador extends User {
  tipo: 'comprador';
  empresa: {
    nombre: string;
    rubro: 'restaurante' | 'agroindustria' | 'distribuidor' | 'otro';
    nit?: string;
  };
  comprasRealizadas: number;
  calificacion: number;
}
