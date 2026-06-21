# 🖼️ Configuración de Cloudinary para Subidas de Imágenes

## ¿Por qué Cloudinary?
- ✅ Subidas de imágenes rápidas y seguras
- ✅ Optimización automática
- ✅ CDN global para descargas rápidas
- ✅ Plan gratuito generoso (25GB/mes)
- ✅ URLs permanentes para MongoDB

## Pasos de Configuración

### 1. Crear Cuenta en Cloudinary
1. Ve a: https://cloudinary.com/users/register/free
2. Regístrate con tu email
3. Completa el formulario de registro
4. Verifica tu email

### 2. Obtener Credenciales
1. Inicia sesión en tu dashboard: https://cloudinary.com/console
2. En la sección "Account" verás:
   - **Cloud Name** (ej: djrulo)
   - **API Key** (número largo)
   - **API Secret** (texto largo)

### 3. Configurar .env
Abre `server/.env` y actualiza:
```env
# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
CLOUDINARY_API_KEY=tu_api_key_aqui
CLOUDINARY_API_SECRET=tu_api_secret_aqui
```

**⚠️ Importante:**
- No compartas el `API_SECRET` en público
- Nunca lo subas a GitHub sin añadirlo a `.gitignore`

### 4. Reiniciar el Servidor
```bash
cd server
npm run dev
```

## Cómo Usar el Administrador

1. Ve a: http://localhost:5173/admin/login
2. Login con:
   - 📧 admin@quingo.com
   - 🔑 admin123456
3. Haz clic en "Nuevo Producto"
4. Haz clic en la zona de imagen para seleccionar un archivo
5. La imagen se subirá automáticamente a Cloudinary
6. ✓ La URL se guardará en el producto automáticamente

## Troubleshooting

### Error: "Cloudinary not configured"
- Verifica que las credenciales en `.env` sean correctas
- Reinicia el servidor después de actualizar `.env`

### Error: "Only image files allowed"
- Asegúrate de seleccionar un archivo de imagen (JPG, PNG, GIF, WebP, etc.)

### Imagen no aparece en el producto
- Verifica que la subida fue exitosa (debería mostrar "✓ Imagen subida exitosamente")
- La URL debe comenzar con `https://res.cloudinary.com/`

## Límites de Cloudinary Free
- 25GB de almacenamiento/mes
- 25M de transformaciones/mes
- 1 subida simultánea
- Tarjeta de crédito no requerida

Para más información: https://cloudinary.com/pricing
