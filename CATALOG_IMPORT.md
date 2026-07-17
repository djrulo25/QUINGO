# Importación masiva de catálogo

El panel **Administración → Configuración → Importar catálogo** acepta archivos `.xlsx`, `.xls` y `.csv`.

## Excel recomendado

Utiliza cuatro hojas:

- `Categorias`: `nombre`, `slug`, `descripcion`, `imagen`, `orden`, `activo`.
- `Subcategorias`: `categoria`, `nombre`, `slug`, `descripcion`, `imagen`, `orden`, `activo`.
- `Atributos`: `categoria`, `subcategoria`, `nombre_atributo`, `clave`, `tipo_atributo`, `opciones`, `obligatorio`, `usar_como_filtro`, `unidad`, `ayuda`, `orden`.
- `Productos`: `sku`, `nombre`, `descripcion`, `precio`, `precio_original`, `existencias`, `categoria`, `subcategoria`, `imagen`, `imagenes`, `atributos`, `clave_sat`, `unidad_sat`, `objeto_impuesto`, `tasa_iva`.

Las opciones y las imágenes múltiples se separan con `|`. Las imágenes deben ser URLs públicas, preferentemente de Cloudinary. Los atributos del producto pueden enviarse como JSON:

```json
{"voltaje":"127 V","potencia":650,"garantia":"1 año"}
```

Los tipos de atributo permitidos son `text`, `number`, `select`, `checkbox`, `date` y `textarea`.

## CSV

Un CSV de productos puede usar directamente las columnas de la hoja `Productos`. Para combinar distintos registros en un mismo CSV agrega `tipo_registro` con uno de estos valores:

- `categoria`
- `subcategoria`
- `atributo`
- `producto`

## Flujo seguro

1. Selecciona el archivo.
2. Revisa el resumen y los errores por fila.
3. Corrige el archivo si la validación falla.
4. Pulsa **Confirmar importación** solamente cuando el archivo sea válido.

Los SKU existentes se actualizan y los nuevos se crean. Las categorías, subcategorías y atributos también se actualizan por su slug o clave, evitando duplicados al repetir una importación.
