# 🛣️ RUTAS Y ENDPOINTS - MÓDULO DE ADMINISTRADOR DE PEDIDOS

## Frontend Routes

### Admin Panel - Gestión de Pedidos

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/orders` | `AdminOrdersPage` | Listado principal de todos los pedidos |
| `/admin/orders/:id` | `AdminOrderDetail` | Detalle completo de un pedido específico |

### Admin Panel - Gestión de Productos (Existentes)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/login` | `AdminLoginPage` | Login de administrador |
| `/admin/products` | `AdminProductsPage` | Listado de productos |
| `/admin/products/new` | `AdminProductForm` | Crear nuevo producto |
| `/admin/products/:id/edit` | `AdminProductForm` | Editar producto existente |

### Tienda Online (Existentes)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `HomePage` | Página de inicio |
| `/products` | `ProductsPage` | Catálogo de productos |
| `/products/:id` | `ProductDetailPage` | Detalle de producto |
| `/cart` | `CartPage` | Carrito de compras |
| `/checkout` | `CheckoutPage` | Checkout y creación de pedido |
| `/order-confirmation/:orderId` | `OrderConfirmationPage` | Confirmación de pedido |
| `/customer/login` | `CustomerLoginPage` | Login de cliente |
| `/customer/register` | `CustomerRegisterPage` | Registro de cliente |
| `/customer/forgot-password` | `ForgotPasswordPage` | Recuperar contraseña |
| `/customer/reset-password` | `ResetPasswordPage` | Cambiar contraseña |
| `/customer/profile` | `CustomerProfilePage` | Perfil del cliente |
| `/customer/orders` | `OrderHistoryPage` | Historial de órdenes del cliente |

---

## Backend API Endpoints

### Orders - CRUD Operations

#### 1. GET `/api/orders` - **NUEVO ✨**

**Descripción:** Obtiene TODOS los pedidos (para admin)

**Autenticación:** Requerida (Bearer token)

**Petición:**
```bash
GET http://localhost:3000/api/orders
Headers:
  Authorization: Bearer {adminToken}
  Content-Type: application/json
```

**Respuesta (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1718876543210",
    "customer": {
      "firstName": "Juan",
      "lastName": "García",
      "email": "juan@example.com",
      "phone": "+52 5555555555",
      "company": "Empresa XYZ"
    },
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 2,
        "price": 450.00
      }
    ],
    "shippingAddress": {
      "street": "Boulevard Reforma",
      "number": "500",
      "complement": "Piso 10",
      "city": "Guadalajara",
      "state": "Jalisco",
      "zipCode": "44100",
      "country": "Mexico"
    },
    "shippingMethod": "Envío Express",
    "shippingCost": 20.00,
    "subtotal": 450.00,
    "tax": 45.00,
    "total": 515.00,
    "status": "pending",
    "paymentMethod": "Tarjeta de Crédito",
    "paymentStatus": "completed",
    "notes": "Nota del admin",
    "trackingNumber": "DHL1234567890",
    "returnReason": null,
    "createdAt": "2026-06-20T10:30:00.000Z",
    "updatedAt": "2026-06-20T10:30:00.000Z"
  }
]
```

**Errores:**
- 401: Unauthorized (token inválido o falta)
- 500: Error en servidor

---

#### 2. GET `/api/orders/:id`

**Descripción:** Obtiene un pedido específico por ID

**Petición:**
```bash
GET http://localhost:3000/api/orders/507f1f77bcf86cd799439011
Headers:
  Content-Type: application/json
```

**Respuesta (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-1718876543210",
  // ... (mismo formato que en GET /api/orders)
}
```

**Errores:**
- 404: Order not found
- 500: Error en servidor

---

#### 3. POST `/api/orders` - Crear Pedido

**Descripción:** Crea un nuevo pedido (usado por checkout)

**Petición:**
```bash
POST http://localhost:3000/api/orders
Headers:
  Content-Type: application/json

Body:
{
  "customer": {
    "firstName": "Juan",
    "lastName": "García",
    "email": "juan@example.com",
    "phone": "+52 5555555555",
    "company": "Empresa XYZ"
  },
  "items": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "price": 450.00
    }
  ],
  "shippingAddress": {
    "street": "Boulevard Reforma",
    "number": "500",
    "complement": "Piso 10",
    "city": "Guadalajara",
    "state": "Jalisco",
    "zipCode": "44100",
    "country": "Mexico"
  },
  "shippingMethod": "Envío Express",
  "shippingCost": 20.00,
  "subtotal": 450.00,
  "tax": 45.00,
  "total": 515.00,
  "paymentMethod": "Tarjeta de Crédito"
}
```

**Respuesta (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-1718876543210",
  "status": "pending",
  "paymentStatus": "pending",
  // ... (datos enviados)
}
```

**Errores:**
- 400: Error creating order

---

#### 4. PUT `/api/orders/:id` - **MEJORADO ✨**

**Descripción:** Actualiza un pedido existente (cambiar estado, agregar tracking, etc.)

**Autenticación:** Requerida (Bearer token)

**Petición:**
```bash
PUT http://localhost:3000/api/orders/507f1f77bcf86cd799439011
Headers:
  Authorization: Bearer {adminToken}
  Content-Type: application/json

Body (ejemplo 1 - cambiar estado):
{
  "status": "confirmed"
}

Body (ejemplo 2 - marcar como enviado con tracking):
{
  "status": "shipped",
  "trackingNumber": "DHL1234567890"
}

Body (ejemplo 3 - devolver con razón):
{
  "status": "returned",
  "returnReason": "Producto defectuoso, rayado en la esquina"
}

Body (ejemplo 4 - actualizar notas):
{
  "notes": "Cliente solicita cambio de dirección, contactar antes de enviar"
}

Body (ejemplo 5 - múltiples cambios):
{
  "status": "shipped",
  "trackingNumber": "UPS9876543210",
  "notes": "Enviado con asegurado"
}
```

**Respuesta (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-1718876543210",
  "status": "shipped",
  "trackingNumber": "DHL1234567890",
  "notes": "Enviado con asegurado",
  "updatedAt": "2026-06-20T14:45:00.000Z",
  // ... (datos actualizados)
}
```

**Errores:**
- 400: Error updating order
- 404: Order not found
- 401: Unauthorized

---

#### 5. GET `/api/orders/customer/:email`

**Descripción:** Obtiene todos los pedidos de un cliente específico

**Petición:**
```bash
GET http://localhost:3000/api/orders/customer/juan@example.com
Headers:
  Content-Type: application/json
```

**Respuesta (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1718876543210",
    // ... (datos del pedido)
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "orderNumber": "ORD-1718876543211",
    // ... (otro pedido del mismo cliente)
  }
]
```

**Errores:**
- 500: Error fetching orders

---

## Estados y Transiciones Válidas

### Estados Disponibles
```
pending    → Estado inicial (Pendiente)
confirmed  → Confirmado por admin
shipped    → Enviado (con tracking)
delivered  → Entregado
cancelled  → Cancelado
returned   → Devuelto (con razón)
```

### Transiciones Permitidas
```
pending → confirmed (sin requisitos)
pending → cancelled (sin requisitos)

confirmed → shipped (REQUIERE: trackingNumber)
confirmed → cancelled (sin requisitos)

shipped → delivered (sin requisitos)
shipped → returned (REQUIERE: returnReason)

returned → confirmed (para reabrir)

delivered [FINAL - no más cambios]
cancelled [FINAL - no más cambios]
```

---

## Validaciones y Restricciones

### Frontend (AdminOrderDetail)
- ✅ No permite enviar sin `trackingNumber`
- ✅ No permite devolver sin `returnReason`
- ✅ Solo muestra opciones válidas de estado según el actual
- ✅ Valida que campos requeridos no estén vacíos

### Backend
- ✅ Verifica autenticación (token admin)
- ✅ Valida que el pedido exista
- ✅ Acepta campos: `status`, `trackingNumber`, `returnReason`, `notes`
- ✅ Descarta campos no autorizados

---

## Ejemplos de Uso

### Ejemplo 1: Confirmar un pedido pendiente

```bash
curl -X PUT http://localhost:3000/api/orders/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

### Ejemplo 2: Marcar como enviado con número de tracking

```bash
curl -X PUT http://localhost:3000/api/orders/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "trackingNumber": "DHL20260620123456"
  }'
```

### Ejemplo 3: Procesar devolución

```bash
curl -X PUT http://localhost:3000/api/orders/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "returned",
    "returnReason": "Producto llegó con defecto de fabricación, botones rotos"
  }'
```

### Ejemplo 4: Obtener todos los pedidos para admin

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/orders
```

---

## Códigos de Respuesta HTTP

| Código | Significado | Causa Común |
|--------|------------|-------------|
| 200 | OK | Petición exitosa |
| 201 | Created | Pedido creado exitosamente |
| 400 | Bad Request | Datos inválidos o error en el cambio |
| 401 | Unauthorized | Token inválido o falta autenticación |
| 404 | Not Found | Pedido no existe |
| 500 | Server Error | Error en el servidor |

---

## Headers Requeridos

```javascript
// Para GET /api/orders (admin)
{
  "Authorization": "Bearer {adminToken}",
  "Content-Type": "application/json"
}

// Para PUT /api/orders/:id (admin)
{
  "Authorization": "Bearer {adminToken}",
  "Content-Type": "application/json"
}

// Para GET /api/orders/:id (público)
{
  "Content-Type": "application/json"
}

// Para POST /api/orders (desde checkout)
{
  "Content-Type": "application/json"
}
```

---

## Notas Importantes

### Autenticación
- El `adminToken` se obtiene del login en `/admin/login`
- Se almacena en `localStorage.adminToken`
- Se incluye automáticamente en todas las peticiones admin

### Campos Nuevos (NUEVO)
- `notes` - Visible solo para admin, no para cliente
- `trackingNumber` - Número de seguimiento del envío
- `returnReason` - Razón registrada de devolución

### Timestamps
- `createdAt` - Cuándo se creó el pedido
- `updatedAt` - Última vez que se actualizó
- Se actualizan automáticamente en el backend

### Base de Datos
- Todos los datos se guardan en `MongoDB Atlas`
- En colección `orders`
- Con índice en `orderNumber` para búsquedas rápidas

---

## Resumen de Cambios

### ✨ NUEVO
- `GET /api/orders` - Obtener todos los pedidos
- `/admin/orders` - Ruta de listado
- `/admin/orders/:id` - Ruta de detalle
- Campos: `notes`, `trackingNumber`, `returnReason`

### 🔄 MEJORADO
- `PUT /api/orders/:id` - Ahora acepta nuevos campos
- Validaciones más estrictas

### ✓ EXISTENTE
- `POST /api/orders` - Crear pedido
- `GET /api/orders/:id` - Obtener un pedido
- `GET /api/orders/customer/:email` - Pedidos de cliente

---

¡**Listo para consumir desde tu frontend!**
