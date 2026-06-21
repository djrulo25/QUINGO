# QUINGO - Tienda Industrial PWA

Tienda en línea moderna y progresiva para la venta de accesorios de soldadura, equipos de protección industrial y componentes para gases.

## 🚀 Características

- **Progressive Web App (PWA)** - Funciona offline y se instala como app nativa
- **E-commerce Completo** - Catálogo, carrito, checkout
- **Responsive Design** - Funciona en móviles, tablets y desktops
- **Admin Dashboard** - Gestión de productos e inventario
- **Payment Integration** - Integración con Stripe
- **Search & Filters** - Búsqueda y filtrado avanzado
- **Order Management** - Seguimiento de pedidos
- **Service Worker** - Cache inteligente y sincronización en background

## 📋 Requisitos

- Node.js 18+
- MongoDB local o Atlas
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd quingo
```

### 2. Instalar dependencias

```bash
# Instalar todas las dependencias
npm install

# O para cada parte por separado
cd client && npm install
cd ../server && npm install
```

### 3. Configurar variables de entorno

#### Backend (.env)
```bash
cp server/.env.example server/.env
# Editar server/.env con tus configuraciones
```

Variables importantes:
- `MONGODB_URI` - URL de tu base de datos MongoDB
- `JWT_SECRET` - Clave secreta para JWT
- `FRONTEND_URL` - URL del frontend para CORS
- `STRIPE_SECRET_KEY` - Clave de Stripe (si usas pagos)

## 🚀 Desarrollo

### Modo desarrollo (ambos servidores)

```bash
npm run dev
```

Esto inicia:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Desarrollo individual

```bash
# Solo frontend
cd client && npm run dev

# Solo backend
cd server && npm run dev
```

## 📦 Producción

### Build

```bash
npm run build
```

### Iniciar servidor de producción

```bash
npm run start
```

## 📁 Estructura del Proyecto

```
quingo/
├── client/                 # Frontend React + PWA
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── api/           # Cliente HTTP
│   │   ├── types/         # TypeScript types
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utilidades
│   ├── public/
│   │   ├── manifest.json  # PWA manifest
│   │   ├── sw.js         # Service Worker
│   │   └── icons/        # Iconos PWA
│   └── package.json
│
├── server/                 # Backend Express
│   ├── src/
│   │   ├── routes/        # Rutas API
│   │   ├── models/        # Modelos Mongoose
│   │   ├── config/        # Configuraciones
│   │   ├── middleware/    # Middlewares
│   │   └── index.ts       # Entry point
│   ├── .env.example       # Variables de ejemplo
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Productos
- `GET /api/products` - Listar todos los productos
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear producto (Admin)
- `PUT /api/products/:id` - Actualizar producto (Admin)
- `DELETE /api/products/:id` - Eliminar producto (Admin)

### Órdenes
- `POST /api/orders` - Crear orden
- `GET /api/orders/:id` - Obtener orden
- `GET /api/orders/customer/:email` - Órdenes del cliente

### Categorías
- `GET /api/categories` - Listar categorías

## 🏗️ Tecnologías

### Frontend
- React 18+
- TypeScript
- Vite
- React Router
- Zustand (State Management)
- TailwindCSS
- Axios
- Service Worker API

### Backend
- Node.js + Express
- MongoDB + Mongoose
- TypeScript
- JWT
- CORS
- Bcryptjs (Hashing)

## 📱 PWA Features

- ✅ Instalable en dispositivos
- ✅ Funciona offline
- ✅ Sincronización en background
- ✅ Push notifications (ready)
- ✅ App shortcuts
- ✅ Responsive design

## 🔐 Seguridad

- CORS configurado
- Validación de entrada
- Variables de entorno sensibles
- Hash de contraseñas
- JWT para autenticación

## 📊 Base de Datos

### Collections

**Products**
- Productos del catálogo
- Inventario
- Especificaciones

**Orders**
- Pedidos de clientes
- Estado de envío
- Información de pago

**Customers**
- Información de clientes
- Direcciones
- Historial de compras

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - ver LICENSE.md para más detalles

## 👤 Autor

Quingo - Soluciones Industriales

## 📞 Soporte

Para soporte, contactar a: info@quingo.com

## 🗺️ Roadmap

- [ ] Autenticación completa de usuarios
- [ ] Panel de administración
- [ ] Integración de pagos Stripe
- [ ] Notificaciones push
- [ ] Chat en vivo
- [ ] Reviews y ratings
- [ ] Wish list
- [ ] Recomendaciones personalizadas
- [ ] Multi-idioma

---

**Desarrollado con ❤️ para la industria**
