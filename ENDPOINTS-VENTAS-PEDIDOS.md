# 🛍️ Endpoints Faltantes: Ventas y Pedidos

## 📊 ENDPOINTS DE VENTAS

### **1. Crear Tabla de Ventas (Backend)**
```sql
CREATE TABLE ventas (
    id_venta INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
```

### **2. Endpoint de Estadísticas de Ventas**
```javascript
// backend/routes/ventas.js
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Ventas de hoy
        const ventasHoy = await db.query(`
            SELECT COUNT(*) as cantidad, SUM(total) as ingresos 
            FROM ventas 
            WHERE DATE(fecha_venta) = CURDATE() AND estado = 'completada'
        `);

        // Ventas de la semana
        const ventasSemana = await db.query(`
            SELECT COUNT(*) as cantidad, SUM(total) as ingresos 
            FROM ventas 
            WHERE fecha_venta >= ? AND estado = 'completada'
        `, [startOfWeek]);

        // Ventas del mes
        const ventasMes = await db.query(`
            SELECT COUNT(*) as cantidad, SUM(total) as ingresos 
            FROM ventas 
            WHERE fecha_venta >= ? AND estado = 'completada'
        `, [startOfMonth]);

        // Promedio de venta
        const promedioVenta = await db.query(`
            SELECT AVG(total) as promedio 
            FROM ventas 
            WHERE estado = 'completada'
        `);

        res.json({
            ventasHoy: ventasHoy[0]?.cantidad || 0,
            ventasSemana: ventasSemana[0]?.cantidad || 0,
            ventasMes: ventasMes[0]?.cantidad || 0,
            ingresosDiarios: ventasHoy[0]?.ingresos || 0,
            ingresosSemana: ventasSemana[0]?.ingresos || 0,
            ingresosMensuales: ventasMes[0]?.ingresos || 0,
            promedioVenta: promedioVenta[0]?.promedio || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas de ventas' });
    }
});
```

## 📦 ENDPOINTS DE PEDIDOS

### **1. Crear Tabla de Pedidos (Backend)**
```sql
CREATE TABLE pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP NULL,
    direccion_entrega TEXT,
    notas TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE pedidos_detalle (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
```

### **2. Endpoint de Estadísticas de Pedidos**
```javascript
// backend/routes/pedidos.js
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Contar pedidos por estado
        const estadisticas = await db.query(`
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM pedidos 
            GROUP BY estado
        `);

        // Total de pedidos
        const totalPedidos = await db.query(`
            SELECT COUNT(*) as total FROM pedidos
        `);

        // Pedidos del día actual
        const pedidosHoy = await db.query(`
            SELECT COUNT(*) as hoy 
            FROM pedidos 
            WHERE DATE(fecha_pedido) = CURDATE()
        `);

        const result = {
            pendientes: 0,
            en_proceso: 0,
            completados: 0,
            cancelados: 0,
            total: totalPedidos[0]?.total || 0,
            hoy: pedidosHoy[0]?.hoy || 0
        };

        // Mapear estadísticas por estado
        estadisticas.forEach(stat => {
            switch(stat.estado) {
                case 'pendiente':
                    result.pendientes = stat.cantidad;
                    break;
                case 'en_proceso':
                    result.en_proceso = stat.cantidad;
                    break;
                case 'completado':
                    result.completados = stat.cantidad;
                    break;
                case 'cancelado':
                    result.cancelados = stat.cantidad;
                    break;
            }
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas de pedidos' });
    }
});
```

## 🔧 IMPLEMENTACIÓN RÁPIDA

### **Pasos para Backend:**
1. **Crear las tablas** con los SQL de arriba
2. **Agregar rutas** en tu app.js:
   ```javascript
   app.use('/api/ventas', ventasRoutes);
   app.use('/api/pedidos', pedidosRoutes);
   ```
3. **Crear archivos de rutas**:
   - `backend/routes/ventas.js`
   - `backend/routes/pedidos.js`

### **Frontend ya está listo:**
- AdminStatsService ya tiene métodos para estos endpoints
- Dashboard automáticamente los usará cuando estén disponibles
- Sistema de fallback mantiene funcionalidad mientras tanto

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Ventas:
- [ ] Crear tabla `ventas`
- [ ] Crear tabla `ventas_detalle` (opcional, para múltiples productos por venta)
- [ ] Implementar ruta `/api/ventas/admin/stats`
- [ ] Probar endpoint con Postman

### Pedidos:
- [ ] Crear tabla `pedidos`
- [ ] Crear tabla `pedidos_detalle`
- [ ] Implementar ruta `/api/pedidos/admin/stats`
- [ ] Probar endpoint con Postman

### Testing:
- [ ] Insertar datos de prueba en las tablas
- [ ] Verificar que el dashboard muestre estadísticas reales
- [ ] Confirmar que los números cambien al refrescar

**Tiempo estimado de implementación: 2-3 horas** 🕐
