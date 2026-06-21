# 👤 Módulo de Clientes - QUINGO

Sistema completo de gestión de clientes similar a Walmart, Bodega Aurrera y Mercado Libre.

## ✨ Características Implementadas

### 🔐 Autenticación
- ✅ Registro de clientes con validación
- ✅ Login con JWT
- ✅ Recuperación de contraseña por email
- ✅ Restablecimiento de contraseña seguro
- ✅ Verificación de token

### 👨‍💼 Perfil del Cliente
- ✅ Vista de información personal
- ✅ Edición de datos (nombre, apellido, teléfono, empresa, fecha de nacimiento)
- ✅ Foto de perfil (preparado)
- ✅ Email inmutable

### 📍 Gestión de Direcciones
- ✅ Agregar múltiples direcciones
- ✅ Editar direcciones
- ✅ Eliminar direcciones
- ✅ Establecer dirección predeterminada
- ✅ Clasificación: Casa, Trabajo, Otro
- ✅ Campos completos: calle, número, complemento, ciudad, estado, código postal, país

### 📦 Historial de Pedidos
- ✅ Ver todos los pedidos del cliente
- ✅ Detalles de cada pedido
- ✅ Estado del pedido (Pendiente, Confirmado, Enviado, Entregado, Cancelado)
- ✅ Información de envío
- ✅ Total del pedido

### 🔐 Seguridad
- ✅ Contraseñas hasheadas con bcrypt
- ✅ JWT con expiración (30 días)
- ✅ Middleware de autenticación
- ✅ Validación de datos con express-validator
- ✅ CORS configurado

## 📁 Estructura de Carpetas

### Backend
```
server/src/
├── models/
│   ├── Customer.ts          # Modelo principal con direcciones integradas
│   ├── Order.ts             # (Existente)
│   └── ...
├── routes/
│   ├── customerAuth.ts      # Auth: register, login, forgot-password, reset-password
│   ├── customers.ts         # Profile, addresses, orders
│   └── ...
├── middleware/
│   ├── customerAuth.ts      # Middleware de autenticación de clientes
│   └── ...
└── index.ts                 # Actualizado con nuevas rutas
```

### Frontend
```
client/src/
├── types/
│   └── customer.ts          # Interfaces: ICustomer, IAddress, IOrder
├── store/
│   └── customerStore.ts     # Zustand store con persistencia
├── api/
│   └── customerApi.ts       # Axios instance y endpoints
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── ResetPasswordForm.tsx
│   └── AddressForm.tsx
├── pages/
│   ├── CustomerLoginPage.tsx
│   ├── CustomerRegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── CustomerProfilePage.tsx
│   └── OrderHistoryPage.tsx
└── App.tsx                  # Actualizado con nuevas rutas
```

## 🚀 API Endpoints

### Autenticación
```
POST   /api/customer/auth/register         # Registrar cliente
POST   /api/customer/auth/login            # Iniciar sesión
GET    /api/customer/auth/verify           # Verificar token
POST   /api/customer/auth/forgot-password  # Solicitar recuperación
POST   /api/customer/auth/reset-password   # Restablecer contraseña
```

### Perfil
```
GET    /api/customers/profile              # Obtener perfil (protegido)
PUT    /api/customers/profile              # Actualizar perfil (protegido)
```

### Direcciones
```
GET    /api/customers/addresses            # Obtener todas las direcciones
POST   /api/customers/addresses            # Agregar nueva dirección
PUT    /api/customers/addresses/:id        # Actualizar dirección
PUT    /api/customers/addresses/:id/set-default  # Establecer predeterminada
DELETE /api/customers/addresses/:id        # Eliminar dirección
```

### Pedidos
```
GET    /api/customers/orders               # Obtener historial de pedidos
GET    /api/customers/orders/:id           # Obtener detalles de pedido
```

## 🔧 Variables de Entorno (Backend)

```env
# Autenticación
JWT_SECRET=tu_clave_super_secreta

# Email (para recuperación de contraseña)
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_app

# URLs
FRONTEND_URL=http://localhost:5173
```

## 💾 Modelo de Base de Datos

### Customer Schema
```typescript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,
  profileImage: String (optional),
  addresses: [{
    _id: ObjectId,
    label: 'home' | 'work' | 'other',
    firstName: String,
    lastName: String,
    phone: String,
    street: String,
    number: String,
    complement: String (optional),
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean,
    createdAt: Date
  }],
  dateOfBirth: Date (optional),
  cpf: String (optional, unique),
  company: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Rutas del Frontend

```
/customer/login                 # Página de login
/customer/register             # Página de registro
/customer/forgot-password      # Solicitar recuperación
/customer/reset-password       # Restablecer contraseña (con ?token=...)
/customer/profile              # Perfil + Gestión de direcciones
/customer/orders               # Historial de pedidos
```

## 🔄 Flujo de Autenticación

1. **Registro**
   - Usuario completa formulario
   - Backend valida datos
   - Password se hashea
   - Se genera JWT token
   - Cliente se autentica automáticamente

2. **Login**
   - Usuario ingresa email y password
   - Backend verifica credenciales
   - Se genera JWT token
   - Token se almacena en localStorage (persistido)

3. **Recuperación de Contraseña**
   - Usuario solicita recuperación
   - Se envía email con enlace temporal (1 hora)
   - Usuario abre enlace y establece nueva contraseña
   - Puede volver a login

## 🛠️ Instalación

### Backend
```bash
cd server

# Las dependencias ya incluyen:
# - bcryptjs (para hashing)
# - express-validator (para validación)
# - jsonwebtoken (para JWT)
# - nodemailer (para emails)

npm install nodemailer  # Si falta

npm run dev
```

### Frontend
```bash
cd client

# Las dependencias ya incluyen:
# - zustand (para state management)
# - axios (para API calls)
# - react-hot-toast (para notificaciones)

npm run dev
```

## 📝 Ejemplos de Uso

### Registrarse
```typescript
import { useCustomerStore } from '@/store/customerStore'

function RegisterComponent() {
  const { register, isLoading } = useCustomerStore()

  const handleRegister = async () => {
    try {
      await register('email@example.com', 'password123', 'Juan', 'Pérez', '+52123456789')
      // Redirect a perfil
    } catch (error) {
      // Mostrar error
    }
  }
}
```

### Agregar Dirección
```typescript
import { customerAPI } from '@/api/customerApi'

const response = await customerAPI.addAddress({
  label: 'home',
  firstName: 'Juan',
  lastName: 'Pérez',
  phone: '+52123456789',
  street: 'Avenida Principal',
  number: '123',
  city: 'México',
  state: 'CDMX',
  zipCode: '06500',
  country: 'México',
  isDefault: true
})
```

### Acceder al Perfil del Cliente
```typescript
import { useCustomerStore } from '@/store/customerStore'

function ProfileComponent() {
  const { customer, token } = useCustomerStore()

  if (!token) {
    // Redirigir a login
  }

  return (
    <div>
      {customer?.firstName} {customer?.lastName}
    </div>
  )
}
```

## 🎨 Componentes Principales

### LoginForm
- Email y password
- Link a registro
- Link a recuperación de contraseña
- Loader durante petición

### RegisterForm
- Nombre, apellido, email, teléfono
- Password con confirmación
- Validación de contraseñas coincidentes

### AddressForm
- Formulario completo con validación
- Modo edición y creación
- Checkbox para dirección predeterminada

### CustomerProfilePage
- Información personal editable
- Listado de direcciones
- Botones para editar, eliminar, hacer predeterminada

### OrderHistoryPage
- Listado de pedidos
- Modal con detalles de pedido
- Estados visuales

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 saltos)
- ✅ JWT con expiración
- ✅ Validación en servidor
- ✅ Protección CORS
- ✅ Middleware de autenticación
- ✅ Email no se puede cambiar
- ✅ Campos sensibles no se devuelven

## 📊 Próximas Mejoras

- [ ] Autenticación con redes sociales
- [ ] Verificación de email en registro
- [ ] Factor de autenticación dual (2FA)
- [ ] Foto de perfil con Cloudinary
- [ ] Historial de cambios de dirección
- [ ] Wishlist de productos
- [ ] Calificaciones y reseñas
- [ ] Descuentos por cliente
- [ ] Sistema de puntos/rewards

## 🐛 Troubleshooting

### Error: "No token provided"
- Verifica que el header Authorization esté correcto
- Formato: `Authorization: Bearer <token>`

### Error: "Invalid or expired token"
- El token ha expirado (30 días)
- Usuario debe volver a login

### Error al enviar emails
- Verifica variables de entorno EMAIL_*
- En Gmail, usa contraseña de app (no la contraseña normal)

### CORS error
- Verifica FRONTEND_URL en .env
- Debe coincidir con URL del cliente

## 📞 Soporte

Para problemas con este módulo, revisa:
1. Logs del servidor (`npm run dev`)
2. Consola del navegador (F12)
3. Respuesta de la API en Network tab
4. Variables de entorno

---

**Versión**: 1.0.0  
**Última actualización**: 2026-06-20  
**Autor**: QUINGO Development Team
