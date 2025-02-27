# Documentación de Servicios

## 1. Servicios de Productos

### 1.1 Crear Producto
**Método:** `POST`  
**Ruta:** `/api/products`  
**Descripción:** Crea un nuevo producto.  
**Parámetros:**
- `salePrice`: Precio de venta del producto (Number).
- `purchaseCost`: Costo de compra del producto (Number).
- `barcode`: Código de barras del producto (String).
- `name`: Nombre del producto (String).
- `description`: Descripción del producto (String, opcional).
- `images`: Imágenes del producto (Array de Strings).
- `quantity`: Cantidad del producto (Number).
- `variants`: Variantes del producto (Array de objetos con `color`, `size`, y `quantity`).

**Ejemplo de Body:**
```json
{
  "salePrice": 100,
  "purchaseCost": 70,
  "barcode": "1234567890123",
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "images": ["url1", "url2"],
  "quantity": 50,
  "variants": [
    {
      "color": "Rojo",
      "size": "M",
      "quantity": 10
    }
  ]
}
```

**Respuesta:**
- `201`: Producto creado exitosamente.
```json
{
  "msg": "Producto creado",
  "product": {
    "salePrice": 100,
    "purchaseCost": 70,
    "barcode": "1234567890123",
    "name": "Producto Ejemplo",
    "description": "Descripción del producto",
    "images": ["url1", "url2"],
    "quantity": 50,
    "variants": [...],
    "createdBy": "userId",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "productId"
  }
}
```
- `500`: Error en el servidor.

---

### 1.2 Obtener Todos los Productos
**Método:** `GET`  
**Ruta:** `/api/products`  
**Descripción:** Obtiene una lista de todos los productos.  

**Respuesta:**
- `200`: Lista de productos.
```json
[
  {
    "salePrice": 100,
    "purchaseCost": 70,
    "barcode": "1234567890123",
    "name": "Producto Ejemplo",
    "description": "Descripción del producto",
    "images": ["url1", "url2"],
    "quantity": 50,
    "variants": [...],
    "createdBy": "userId",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "productId"
  },
  ...
]
```
- `500`: Error en el servidor.

---

### 1.3 Obtener Producto por ID
**Método:** `GET`  
**Ruta:** `/api/products/:id`  
**Descripción:** Obtiene un producto específico por su ID.  

**Parámetros:**
- `id`: ID del producto (String).

**Respuesta:**
- `200`: Producto encontrado.
```json
{
  "salePrice": 100,
  "purchaseCost": 70,
  "barcode": "1234567890123",
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "images": ["url1", "url2"],
  "quantity": 50,
  "variants": [...],
  "createdBy": "userId",
  "createdAt": "2025-02-19T09:49:20.000Z",
  "updatedAt": "2025-02-19T09:49:20.000Z",
  "_id": "productId"
}
```
- `404`: Producto no encontrado.
- `500`: Error en el servidor.

---

### 1.4 Actualizar Producto
**Método:** `PUT`  
**Ruta:** `/api/products/:id`  
**Descripción:** Actualiza un producto existente.  

**Parámetros:**
- `id`: ID del producto (String).

**Ejemplo de Body:**
```json
{
  "salePrice": 120,
  "quantity": 60
}
```

**Respuesta:**
- `200`: Producto actualizado.
```json
{
  "msg": "Producto actualizado",
  "product": {
    "salePrice": 120,
    "purchaseCost": 70,
    "barcode": "1234567890123",
    "name": "Producto Ejemplo",
    "description": "Descripción del producto",
    "images": ["url1", "url2"],
    "quantity": 60,
    "variants": [...],
    "createdBy": "userId",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "productId"
  }
}
```
- `404`: Producto no encontrado.
- `500`: Error en el servidor.

---

### 1.5 Eliminar Producto
**Método:** `DELETE`  
**Ruta:** `/api/products/:id`  
**Descripción:** Elimina un producto existente.  

**Parámetros:**
- `id`: ID del producto (String).

**Respuesta:**
- `200`: Producto eliminado.
```json
{
  "msg": "Producto eliminado"
}
```
- `404`: Producto no encontrado.
- `500`: Error en el servidor.

---

### 1.6 Agregar Stock
**Método:** `PATCH`  
**Ruta:** `/api/products/:id/stock`  
**Descripción:** Agrega stock a un producto existente.  

**Parámetros:**
- `id`: ID del producto (String).
- `quantity`: Cantidad a agregar (Number).
- `variant`: (opcional) Detalles de la variante (Object).

**Ejemplo de Body:**
```json
{
  "quantity": 20,
  "variant": {
    "color": "Rojo",
    "size": "M"
  }
}
```

**Respuesta:**
- `200`: Stock actualizado.
```json
{
  "msg": "Stock actualizado",
  "product": {
    "salePrice": 100,
    "purchaseCost": 70,
    "barcode": "1234567890123",
    "name": "Producto Ejemplo",
    "description": "Descripción del producto",
    "images": ["url1", "url2"],
    "quantity": 70,
    "variants": [...],
    "createdBy": "userId",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "productId"
  }
}
```
- `400`: Cantidad inválida.
- `404`: Producto no encontrado.
- `500`: Error en el servidor.

---

## 2. Servicios de Usuarios

### 2.1 Registrar Usuario
**Método:** `POST`  
**Ruta:** `/api/auth/register`  
**Descripción:** Registra un nuevo usuario.  
**Parámetros:**
- `name`: Nombre del usuario (String).
- `email`: Correo electrónico del usuario (String).
- `password`: Contraseña del usuario (String).
- `role`: Rol del usuario (String, opcional, valores: `admin`, `editor`, `seller`).

**Ejemplo de Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Respuesta:**
- `201`: Usuario registrado exitosamente.
```json
{
  "msg": "Usuario registrado",
  "user": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "admin",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "userId"
  }
}
```
- `400`: Usuario ya existe.
- `500`: Error en el servidor.

---

### 2.2 Iniciar Sesión
**Método:** `POST`  
**Ruta:** `/api/auth/login`  
**Descripción:** Inicia sesión de un usuario.  
**Parámetros:**
- `email`: Correo electrónico del usuario (String).
- `password`: Contraseña del usuario (String).

**Ejemplo de Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta:**
- `200`: Token de acceso y usuario.
```json
{
  "token": "jwt.token.here",
  "user": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "admin",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "userId"
  }
}
```
- `400`: Credenciales inválidas.
- `500`: Error en el servidor.

---

### 2.3 Obtener Todos los Usuarios
**Método:** `GET`  
**Ruta:** `/api/users`  
**Descripción:** Obtiene una lista de todos los usuarios.  

**Respuesta:**
- `200`: Lista de usuarios.
```json
[
  {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "admin",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "userId"
  },
  ...
]
```
- `500`: Error en el servidor.

---

### 2.4 Obtener Usuario por ID
**Método:** `GET`  
**Ruta:** `/api/users/:id`  
**Descripción:** Obtiene un usuario específico por su ID.  

**Parámetros:**
- `id`: ID del usuario (String).

**Respuesta:**
- `200`: Usuario encontrado.
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "admin",
  "createdAt": "2025-02-19T09:49:20.000Z",
  "updatedAt": "2025-02-19T09:49:20.000Z",
  "_id": "userId"
}
```
- `404`: Usuario no encontrado.
- `500`: Error en el servidor.

---

### 2.5 Actualizar Usuario
**Método:** `PUT`  
**Ruta:** `/api/users/:id`  
**Descripción:** Actualiza un usuario existente.  

**Parámetros:**
- `id`: ID del usuario (String).

**Ejemplo de Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "role": "editor"
}
```

**Respuesta:**
- `200`: Usuario actualizado.
```json
{
  "msg": "Usuario actualizado",
  "user": {
    "name": "Juan Pérez",
    "email": "juan.perez@example.com",
    "role": "editor",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
    "_id": "userId"
  }
}
```
- `404`: Usuario no encontrado.
- `500`: Error en el servidor.

---

### 2.6 Eliminar Usuario
**Método:** `DELETE`  
**Ruta:** `/api/users/:id`  
**Descripción:** Elimina un usuario existente.  

**Parámetros:**
- `id`: ID del usuario (String).

**Respuesta:**
- `200`: Usuario eliminado.
```json
{
  "msg": "Usuario eliminado"
}
```
- `404`: Usuario no encontrado.
- `500`: Error en el servidor.

---

## 3. Servicios de Recibos

### 3.1 Obtener Recibo
**Método:** `GET`  
**Ruta:** `/api/receipts/:saleId`  
**Descripción:** Obtiene un recibo basado en el ID de la venta.  

**Parámetros:**
- `saleId`: ID de la venta (String).

**Respuesta:**
- `200`: Recibo encontrado o generado.
```json
{
  "sale": "saleId",
  "receiptData": {...},
  "createdAt": "2025-02-19T09:49:20.000Z",
  "_id": "receiptId"
}
```
- `404`: Venta no encontrada.
- `500`: Error en el servidor.

---

## 4. Servicios de Ventas

### 4.1 Crear Venta
**Método:** `POST`  
**Ruta:** `/api/sales`  
**Descripción:** Crea una nueva venta.  
**Parámetros:**
- `items`: Lista de productos a vender (Array de objetos con `productId`, `quantity`, y `variant` opcional).

**Ejemplo de Body:**
```json
{
  "items": [
    {
      "productId": "productId",
      "quantity": 2,
      "variant": {
        "color": "Rojo",
        "size": "M"
      }
    }
  ]
}
```

**Respuesta:**
- `201`: Venta creada exitosamente.
```json
{
  "msg": "Venta creada",
  "sale": {
    "user": "userId",
    "items": [...],
    "totalAmount": 200,
    "saleDate": "2025-02-19T09:49:20.000Z",
    "_id": "saleId"
  }
}
```
- `400`: Error en la solicitud.
- `404`: Producto no encontrado.
- `500`: Error en el servidor.

---

### 4.2 Obtener Todas las Ventas
**Método:** `GET`  
**Ruta:** `/api/sales`  
**Descripción:** Obtiene una lista de todas las ventas.  

**Respuesta:**
- `200`: Lista de ventas.
```json
[
  {
    "user": "userId",
    "items": [...],
    "totalAmount": 200,
    "saleDate": "2025-02-19T09:49:20.000Z",
    "_id": "saleId"
  },
  ...
]
```
- `500`: Error en el servidor.

---

### 4.3 Obtener Venta por ID
**Método:** `GET`  
**Ruta:** `/api/sales/:id`  
**Descripción:** Obtiene una venta específica por su ID.  

**Parámetros:**
- `id`: ID de la venta (String).

**Respuesta:**
- `200`: Venta encontrada.
```json
{
  "user": "userId",
  "items": [...],
  "totalAmount": 200,
  "saleDate": "2025-02-19T09:49:20.000Z",
  "_id": "saleId"
}
```
- `404`: Venta no encontrada.
- `500`: Error en el servidor.

---

## 5. Servicios de Estadísticas

### 5.1 Obtener Estadísticas de Ventas
**Método:** `GET`  
**Ruta:** `/api/stats/sales`  
**Descripción:** Obtiene estadísticas de ventas basadas en filtros de fecha y producto.  
**Parámetros:**
- `startDate`: Fecha de inicio (String, formato ISO).
- `endDate`: Fecha de fin (String, formato ISO).
- `productId`: ID del producto (String, opcional).

**Respuesta:**
- `200`: Estadísticas de ventas.
```json
{
  "totalSales": 10,
  "totalProfit": 5000,
  "sales": [...]
}
```
- `500`: Error en el servidor.

