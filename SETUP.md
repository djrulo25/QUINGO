# Guía Rápida de Instalación

## Prerequisites

- Node.js 18+ 
- MongoDB (local o MongoDB Atlas)
- Git

## Paso 1: Instalación Rápida

```bash
# Instalar todas las dependencias
npm install
```

## Paso 2: Configurar Base de Datos

### Opción A: MongoDB Local
```bash
# Asegúrate de que MongoDB esté corriendo
mongod
```

### Opción B: MongoDB Atlas (Cloud)
1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear una cuenta o login
3. Crear un cluster
4. Obtener la connection string
5. Copiar a `server/.env` como `MONGODB_URI`

## Paso 3: Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp server/.env.example server/.env

# Editar server/.env con tus configuraciones
# Variables mínimas requeridas:
# - MONGODB_URI
# - JWT_SECRET (cualquier string)
# - FRONTEND_URL (http://localhost:5173)
```

## Paso 4: Ejecutar en Desarrollo

```bash
npm run dev
```

Esto abrirá:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Paso 5: Cargar Datos de Prueba

El backend incluye seeding básico. Para agregar productos de prueba:

```bash
# Desde la carpeta server
npm run seed
```

## Estructura de Carpetas

```
quingo/
├── client/          # Frontend React
├── server/          # Backend Node/Express
├── package.json     # Root package.json
└── README.md        # Documentación completa
```

## Comandos Útiles

```bash
# Desarrollo
npm run dev              # Ambos servidores
npm run dev:client      # Solo frontend
npm run dev:server      # Solo backend

# Build
npm run build
npm run build:client
npm run build:server

# Linting
npm run lint
npm run lint:client
npm run lint:server

# Producción
npm run start
npm start               # En carpeta server
```

## Solución de Problemas

### Error: MongoDB connection failed
- Verificar que MongoDB esté corriendo
- Verificar MONGODB_URI en .env
- Para Atlas, verificar IP whitelist y credenciales

### Error: Port 3000 already in use
```bash
# Cambiar puerto en server/.env
PORT=3001
```

### Error: VITE no se inicia
```bash
# Limpiar cache y reinstalar
rm -rf client/node_modules client/dist
cd client && npm install
```

## Próximos Pasos

1. Agregar más productos al catálogo
2. Configurar Stripe para pagos reales
3. Implementar autenticación de usuarios
4. Crear panel de administración
5. Configurar email transaccional# Instala todas las dependencias

## Documentación Completa

Ver [README.md](../README.md) para más detalles.

## Soporte

Para ayuda:
- Revisar README.md
- Crear un issue en GitHub
- Contactar: info@quingo.com
