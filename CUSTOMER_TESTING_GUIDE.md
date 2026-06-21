# 🧪 Guía de Pruebas - Módulo de Clientes QUINGO

## 📋 Requisitos Previos

- Node.js 18+ instalado
- MongoDB corriendo (local o Atlas)
- Backend en puerto 3000
- Frontend en puerto 5173

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias

```bash
# En la carpeta del proyecto
npm install

# O por separado:
cd server && npm install
cd ../client && npm install
```

### 2. Configurar Variables de Entorno

#### Backend (.env)

```bash
cp server/.env.example server/.env
```

Editar `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/quingo
JWT_SECRET=tu_clave_super_secreta_123
FRONTEND_URL=http://localhost:5173

# Email (opcional, solo para recuperación de contraseña)
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_app
```

### 3. Crear Cliente de Prueba (Opcional)

```bash
cd server
npm run create-test-customer
```

Esto creará una cuenta de prueba:
- Email: `cliente@quingo.com`
- Password: `cliente123456`

### 4. Iniciar Servidores

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

El cliente estará en: http://localhost:5173

---

## 🧪 Pruebas Manuales

### Escenario 1: Registro Completo

1. Ir a http://localhost:5173/customer/register
2. Completar el formulario:
   - Nombre: Juan
   - Apellido: Pérez
   - Teléfono: +52 5555555555
   - Email: juan@test.com
   - Contraseña: prueba123456
   - Confirmar: prueba123456
3. Clic en "Crear Cuenta"
4. ✅ Debe redirigir a perfil automáticamente

### Escenario 2: Login

1. Ir a http://localhost:5173/customer/login
2. Usar credenciales:
   - Email: juan@test.com
   - Contraseña: prueba123456
3. Clic en "Iniciar Sesión"
4. ✅ Debe abrir perfil del cliente

### Escenario 3: Editar Perfil

1. En página de perfil (http://localhost:5173/customer/profile)
2. Clic en botón "Editar"
3. Cambiar:
   - Empresa: Acme Corp
   - Teléfono: +52 1234567890
4. Clic en "Guardar Cambios"
5. ✅ Debe mostrar "Perfil actualizado" (toast)
6. Los datos deben reflejarse sin recargar

### Escenario 4: Agregar Dirección

1. En perfil, desplazarse a "Mis Direcciones"
2. Clic en "+ Agregar Dirección"
3. Completar formulario:
   - Tipo: Casa
   - Nombre: Juan
   - Apellido: Pérez
   - Teléfono: +52 5555555555
   - Calle: Avenida Principal
   - Número: 456
   - Complemento: Apto 3A
   - Ciudad: Mexico
   - Estado: CDMX
   - Código Postal: 06500
   - País: Mexico
   - ✓ Marcar "Dirección Predeterminada"
4. Clic en "Agregar"
5. ✅ Debe mostrar "Dirección agregada"
6. La dirección debe aparecer en la lista

### Escenario 5: Editar Dirección

1. En la lista de direcciones, clic en "Editar"
2. Cambiar ciudad: "Monterrey"
3. Clic en "Actualizar"
4. ✅ Debe mostrar "Dirección actualizada"
5. La lista debe refrescarse

### Escenario 6: Establecer Dirección Predeterminada

1. Agregar 2 direcciones diferentes
2. En la segunda dirección, clic en "Hacer Predeterminada"
3. ✅ La primera debe quitar el badge "Predeterminada"
4. ✅ La segunda debe mostrar el badge

### Escenario 7: Eliminar Dirección

1. Clic en "Eliminar" en cualquier dirección
2. Confirmar en el modal
3. ✅ La dirección debe desaparecer
4. Si era predeterminada, otra debe serlo automáticamente

### Escenario 8: Recuperación de Contraseña (Solo con Email Configurado)

1. Ir a http://localhost:5173/customer/forgot-password
2. Ingresa email: juan@test.com
3. Clic en "Enviar Enlace de Recuperación"
4. ✅ Debe mostrar "Si el correo existe, recibirás un enlace"
5. Revisar email (spam también)
6. Hacer clic en el enlace
7. Cambiar contraseña
8. Volver a login con nueva contraseña
9. ✅ Debe funcionar

### Escenario 9: Historial de Pedidos

1. Ir a http://localhost:5173/customer/orders
2. Si no hay pedidos:
   - ✅ Mostrar "No tienes pedidos aún"
   - ✅ Botón "Ir a Productos"
3. Si hay pedidos:
   - ✅ Listarlos con fecha, estado, total
   - Clic en pedido para ver detalles
   - ✅ Modal con toda la información

### Escenario 10: Cerrar Sesión

1. En perfil, clic en "Cerrar Sesión"
2. ✅ Debe redirigir a inicio
3. Intentar ir a /customer/profile
4. ✅ Debe redirigir a login

---

## 🔧 Pruebas de API (Postman/Insomnia)

### 1. Registro

```
POST http://localhost:3000/api/customer/auth/register

Body (JSON):
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User",
  "phone": "+52 1234567890"
}

Response:
{
  "message": "Customer registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "customer": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+52 1234567890"
  }
}
```

### 2. Login

```
POST http://localhost:3000/api/customer/auth/login

Body (JSON):
{
  "email": "test@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "customer": {...}
}
```

### 3. Obtener Perfil

```
GET http://localhost:3000/api/customers/profile

Headers:
Authorization: Bearer <token>

Response:
{
  "_id": "...",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "phone": "+52 1234567890",
  "addresses": [...],
  "createdAt": "2026-06-20T...",
  "updatedAt": "2026-06-20T..."
}
```

### 4. Actualizar Perfil

```
PUT http://localhost:3000/api/customers/profile

Headers:
Authorization: Bearer <token>

Body (JSON):
{
  "firstName": "TestUpdated",
  "company": "My Company"
}

Response:
{
  "message": "Profile updated successfully",
  "customer": {...}
}
```

### 5. Agregar Dirección

```
POST http://localhost:3000/api/customers/addresses

Headers:
Authorization: Bearer <token>

Body (JSON):
{
  "label": "home",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+52 5555555555",
  "street": "Calle Principal",
  "number": "123",
  "complement": "Apto 5",
  "city": "Mexico",
  "state": "CDMX",
  "zipCode": "06500",
  "country": "Mexico",
  "isDefault": true
}

Response:
{
  "message": "Address added successfully",
  "address": {...}
}
```

### 6. Obtener Direcciones

```
GET http://localhost:3000/api/customers/addresses

Headers:
Authorization: Bearer <token>

Response:
[
  {
    "_id": "...",
    "label": "home",
    "firstName": "Juan",
    "lastName": "Pérez",
    ...
  }
]
```

### 7. Obtener Historial de Pedidos

```
GET http://localhost:3000/api/customers/orders

Headers:
Authorization: Bearer <token>

Response:
[
  {
    "_id": "...",
    "orderNumber": "ORD-001",
    "items": [...],
    "total": 1500.00,
    "status": "delivered",
    "createdAt": "2026-06-20T..."
  }
]
```

---

## ⚠️ Errores Comunes y Soluciones

### Error: "Cannot POST /api/customer/auth/register"

**Causa**: Ruta no encontrada o servidor no corriendo

**Solución**:
- Verificar que backend corre en `http://localhost:3000`
- Revisar que la ruta existe en `server/src/index.ts`

### Error: "CORS error"

**Causa**: Origen no permitido

**Solución**:
```bash
# En server/.env, verificar:
FRONTEND_URL=http://localhost:5173
```

### Error: "No token provided"

**Causa**: No se enviò el header Authorization

**Solución**:
```
Headers:
Authorization: Bearer eyJhbGc...
```

### Error: "Invalid or expired token"

**Causa**: Token expirado (30 días)

**Solución**: Hacer login nuevamente

### Error: "Email already registered"

**Causa**: Email ya existe en BD

**Solución**: Usar otro email para registro

### Error al enviar emails de recuperación

**Causa**: Variables de entorno EMAIL no configuradas

**Solución**:
```bash
# En Gmail:
1. Habilitar autenticación de dos factores
2. Crear contraseña de aplicación
3. Usar esa contraseña en EMAIL_PASSWORD
```

---

## 🚀 Flujo Recomendado de Pruebas

1. **Limpiar BD** (opcional): `db.customers.deleteMany({})`
2. **Crear test customer**: `npm run create-test-customer`
3. **Login con test account**: `cliente@quingo.com`
4. **Probar flujo de registro**: Nuevo usuario
5. **Probar flujo de direcciones**: CRUD completo
6. **Probar flujo de órdenes**: Ver historial
7. **Probar recuperación**: Si email está configurado

---

## 📊 Checklist Final

- [ ] Registro funciona
- [ ] Login funciona
- [ ] Perfil se muestra correctamente
- [ ] Editar perfil guarda cambios
- [ ] Agregar dirección funciona
- [ ] Listar direcciones funciona
- [ ] Editar dirección funciona
- [ ] Eliminar dirección funciona
- [ ] Establecer predeterminada funciona
- [ ] Ver historial de pedidos funciona
- [ ] Ver detalles de pedido funciona
- [ ] Logout funciona
- [ ] Protección de rutas funciona
- [ ] Errores se muestran correctamente
- [ ] Toast/notificaciones funcionan

---

## 🐞 Reporte de Errores

Si encuentras un error:

1. Verificar consola del navegador (F12)
2. Revisar logs del servidor
3. Verificar red (Network tab en DevTools)
4. Verificar BD (MongoDB Compass)
5. Revisar variables de entorno

---

**Última actualización**: 2026-06-20
**Versión del módulo**: 1.0.0
