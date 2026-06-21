# Módulo de Administrador - Gestión de Pedidos

## Descripción General

El módulo de administrador para gestión de pedidos permite controlar completamente el ciclo de vida de los pedidos, desde su creación hasta su entrega, incluyendo devoluciones y cambios de estado.

## Características Principales

### 1. **Listado de Pedidos** (`/admin/orders`)
   - Vista de tabla con todos los pedidos
   - Búsqueda en tiempo real por:
     - Número de orden (ej: ORD-1234567890)
     - Email del cliente
     - Nombre del cliente
   - Filtros por estado del pedido:
     - **Pendiente** (amarillo) - Esperando confirmación
     - **Confirmado** (azul) - Pedido confirmado, listo para enviar
     - **Enviado** (púrpura) - En tránsito con número de seguimiento
     - **Entregado** (verde) - Recibido por el cliente
     - **Cancelado** (rojo) - Pedido cancelado
     - **Devuelto** (naranja) - Pedido devuelto

   - **Estadísticas en Tiempo Real:**
     - Total de pedidos pendientes
     - Pedidos confirmados
     - Pedidos enviados
     - Pedidos entregados

   - **Información por Pedido en Tabla:**
     - Número de orden
     - Nombre y email del cliente
     - Total del pedido
     - Estado actual
     - Estado de pago
     - Fecha de creación
     - Botones de acción

### 2. **Cambio Rápido de Estado**
   
   Desde la tabla principal, puedes cambiar el estado directamente:
   
   - **Desde Pendiente:**
     ```
     Pendiente → Confirmar → Confirmado
     Pendiente → Cancelar
     ```
   
   - **Desde Confirmado:**
     ```
     Confirmado → Enviar (requiere número de seguimiento)
     Confirmado → Cancelar
     ```
   
   - **Desde Enviado:**
     ```
     Enviado → Entregar
     Enviado → Reportar Devolución (requiere razón)
     ```

### 3. **Detalle de Pedido** (`/admin/orders/:id`)

   Al hacer clic en "Ver" en cualquier pedido, accedes a la página de detalle completa:

   #### **Panel Izquierdo:**
   
   - **Estado del Pedido**
     - Estado actual con badge de color
     - Estado de pago (Pagado, Pendiente, Fallido)
   
   - **Cambiar Estado**
     - Selector desplegable de estados disponibles
     - Validaciones automáticas
     - Campos adicionales según el estado
   
   - **Número de Seguimiento**
     - Campo para ingresar/actualizar el número de seguimiento
     - Se requiere para marcar como "Enviado"
     - Persiste en la base de datos
   
   - **Razón de Devolución**
     - Campo de texto para registrar por qué se devolvió el pedido
     - Se requiere para reportar una devolución
     - Se muestra en el detalle del cliente
   
   - **Información del Cliente**
     - Nombre completo
     - Email
     - Teléfono
     - Empresa (si aplica)
   
   - **Dirección de Envío**
     - Dirección completa
     - Complemento (apto, depto, etc.)
     - Método de envío elegido
   
   - **Notas Internas**
     - Área de texto para anotaciones privadas
     - No visible para el cliente
     - Útil para recordar detalles importantes

   #### **Panel Derecho:**
   
   - **Resumen del Pedido**
     - Subtotal
     - Costo de envío
     - Impuestos (10%)
     - Total final
   
   - **Lista de Productos**
     - ID del producto
     - Cantidad
     - Precio unitario
     - Subtotal por producto
   
   - **Información de Envío**
     - Número de seguimiento (si disponible)
     - Método de envío

## Flujos de Trabajo

### Flujo Estándar: Pedido Nuevo a Entrega

1. **Cliente Realiza Compra**
   - Pedido aparece en estado "Pendiente"
   - Pago estado "Pendiente"

2. **Admin Confirma Pedido**
   - Entra a la página del pedido
   - Verifica información del cliente y dirección
   - Cambia estado a "Confirmado"
   - Agrega notas si es necesario

3. **Preparar Envío**
   - Admin prepara el pedido
   - Cuando está listo, cambia estado a "Enviado"
   - Ingresa el número de seguimiento
   - El cliente recibe notificación con el tracking

4. **Confirmación de Entrega**
   - Cuando el cliente recibe, admin cambia a "Entregado"
   - Pedido finaliza

### Flujo de Devolución

1. **Cliente Solicita Devolución**
   - El pedido está en estado "Enviado"

2. **Admin Procesa Devolución**
   - En el detalle del pedido, ingresa razón de devolución
   - Cambia estado a "Devuelto"
   - Registra si es por defecto, no conformidad, etc.

3. **Reembolso**
   - Admin puede procesar reembolso en sistema de pagos
   - Actualiza notas internas

### Flujo de Cancelación

1. **Cliente Solicita Cancelación (antes de envío)**
   - Desde tabla o detalle, cambiar a "Cancelado"
   - Agregar nota sobre razón

2. **Procesar Reembolso**
   - Actualizar estado de pago a fallido o procesar reembolso
   - Notificar al cliente

## Campos de Base de Datos Actualizados

El modelo de Order ahora incluye:

```javascript
{
  _id: ObjectId,                    // ID único
  orderNumber: String,              // Ej: ORD-1234567890
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    company: String                 // Opcional
  },
  items: [{
    productId: String,
    quantity: Number,
    price: Number
  }],
  shippingAddress: {
    street: String,
    number: String,
    complement: String,             // Apto, depto, etc
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingMethod: String,           // "Envío Estándar" o "Envío Express"
  shippingCost: Number,
  subtotal: Number,
  tax: Number,
  total: Number,
  status: String,                   // pending, confirmed, shipped, delivered, cancelled, returned
  paymentMethod: String,            // Tarjeta de crédito, transferencia, etc
  paymentStatus: String,            // pending, completed, failed
  notes: String,                    // Notas internas del admin (NUEVO)
  trackingNumber: String,           // Número de seguimiento (NUEVO)
  returnReason: String,             // Razón de devolución (NUEVO)
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints API

### Backend Endpoints

#### GET `/api/orders` (Admin)
- **Autenticación:** Requerida (Bearer token)
- **Retorna:** Array de todos los pedidos ordenados por fecha
- **Uso:** Para cargar el listado principal

```bash
curl -H "Authorization: Bearer token" http://localhost:3000/api/orders
```

#### GET `/api/orders/:id`
- **Retorna:** Detalle completo de un pedido específico
- **Uso:** Para cargar página de detalle

```bash
curl http://localhost:3000/api/orders/507f1f77bcf86cd799439011
```

#### PUT `/api/orders/:id` (Admin)
- **Autenticación:** Requerida
- **Body:** JSON con campos a actualizar
- **Retorna:** Pedido actualizado
- **Campos soportados:**
  - `status` - Cambiar estado
  - `notes` - Actualizar notas internas
  - `trackingNumber` - Agregar/actualizar número de seguimiento
  - `returnReason` - Razón de devolución

```bash
curl -X PUT http://localhost:3000/api/orders/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "status": "shipped",
    "trackingNumber": "TRACK123456"
  }'
```

## Rutas Frontend

- `/admin/orders` - Listado principal de pedidos
- `/admin/orders/:id` - Detalle de un pedido específico

## Componentes Utilizados

### AdminOrdersPage.tsx
- Listado completo con búsqueda y filtros
- Cambio rápido de estado desde tabla
- Estadísticas en tiempo real
- Manejo de múltiples órdenes

### AdminOrderDetail.tsx
- Detalle completo del pedido
- Gestión completa del ciclo de vida
- Campos de seguimiento y devoluciones
- Notas internas

## Estados y Colores

| Estado | Color | Significado |
|--------|-------|-------------|
| Pendiente | 🟡 Amarillo | Esperando confirmación |
| Confirmado | 🔵 Azul | Listo para enviar |
| Enviado | 🟣 Púrpura | En tránsito |
| Entregado | 🟢 Verde | Entregado al cliente |
| Cancelado | 🔴 Rojo | Cancelado |
| Devuelto | 🟠 Naranja | Devuelto por cliente |

## Integración con Sistema Existente

Este módulo se integra perfectamente con:

- **Sistema de Checkout:** Los pedidos creados en checkout automáticamente aparecen en el admin
- **Autenticación Admin:** Usa el mismo token de adminToken
- **Base de datos MongoDB:** Los datos se guardan en la colección `orders`
- **API Consistente:** Sigue el mismo patrón que el módulo de productos

## Próximas Mejoras Sugeridas

1. **Notificaciones por Email**
   - Enviar email al cliente cuando cambia el estado
   - Enviar tracking cuando se marca como "Enviado"

2. **Reportes**
   - Reporte de ventas por fecha
   - Reporte de devoluciones
   - Ingresos totales por período

3. **Automatización**
   - Marcar automáticamente como "Entregado" basado en seguimiento
   - Recordatorios para pedidos pendientes por X días

4. **Integraciones**
   - Integración con servicios de envío (DHL, FedEx, etc)
   - Generación automática de etiquetas de envío
   - Integración con pasarelas de pago para reembolsos

5. **Mejoras UI**
   - Exportar pedidos a CSV/Excel
   - Impresión de documentos (remisiones, etiquetas)
   - Búsqueda avanzada con filtros adicionales

## Troubleshooting

### "Error cargando pedidos"
- Verificar que el token admin es válido
- Verificar conexión a MongoDB
- Revisar logs del servidor en terminal

### "Error actualizando el pedido"
- Verificar que el ID del pedido existe
- Verificar que los datos enviados son válidos
- Revisar console del navegador para detalles

### El número de seguimiento no se guarda
- Asegurarse de hacer clic en el botón "Actualizar Número de Seguimiento"
- Verificar que el número no esté vacío

## Acceso al Módulo

1. Ingresa a `/admin/login`
2. Login con credenciales de admin
3. Navega a `/admin/orders`
4. ¡A administrar pedidos!
