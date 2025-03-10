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
- `images`: Archivos de imagen del producto (Multipart/form-data, máximo 5 imágenes).
- `quantity`: Cantidad del producto (Number).
- `variants`: Variantes del producto (Array de objetos con `color`, `size`, y `quantity`).

**Ejemplo de Body (form-data):**
```
salePrice: 100
purchaseCost: 70
barcode: 1234567890123
name: Producto Ejemplo
description: Descripción del producto
quantity: 50
variants: [{"color":"Rojo","size":"M","quantity":10}]
images: [archivo1.jpg, archivo2.jpg]
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
    "images": ["/uploads/products/1709123456789-123456789.jpg", "/uploads/products/1709123456790-987654321.jpg"],
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
- `images`: Archivos de imagen del producto (Multipart/form-data, máximo 5 imágenes).
- `keepImages`: Si es 'false', se reemplazarán todas las imágenes existentes. Si es 'true' o no se envía, se añadirán las nuevas imágenes a las existentes (String).

**Ejemplo de Body (form-data):**
```
salePrice: 120
quantity: 60
keepImages: true
images: [archivo3.jpg]
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
    "images": [
      "/uploads/products/1709123456789-123456789.jpg", 
      "/uploads/products/1709123456790-987654321.jpg",
      "/uploads/products/1709123456791-456789123.jpg"
    ],
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
  ],
  "paymentMethod": "cash",
  "paymentAmount": 250
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
    "paymentAmount": 250,
    "changeAmount": 50,
    "paymentMethod": "cash",
    "saleDate": "2025-02-19T09:49:20.000Z",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
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
    "paymentAmount": 250,
    "changeAmount": 50,
    "paymentMethod": "cash",
    "saleDate": "2025-02-19T09:49:20.000Z",
    "createdAt": "2025-02-19T09:49:20.000Z",
    "updatedAt": "2025-02-19T09:49:20.000Z",
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
  "paymentAmount": 250,
  "changeAmount": 50,
  "paymentMethod": "cash",
  "saleDate": "2025-02-19T09:49:20.000Z",
  "createdAt": "2025-02-19T09:49:20.000Z",
  "updatedAt": "2025-02-19T09:49:20.000Z",
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

---

## 6. Servicios de Sesiones POS

### 6.1 Obtener Todas las Sesiones POS
**Método:** `GET`  
**Ruta:** `/api/pos-sessions`  
**Descripción:** Obtiene una lista de todas las sesiones POS.  

**Respuesta:**
- `200`: Lista de sesiones POS.
```json
[
  {
    "_id": "sessionId",
    "user": {
      "_id": "userId",
      "name": "Nombre Usuario",
      "email": "usuario@ejemplo.com"
    },
    "openingDate": "2025-03-07T08:00:00.000Z",
    "closingDate": "2025-03-07T18:00:00.000Z",
    "initialCash": 100000,
    "sales": ["saleId1", "saleId2", ...],
    "cashSalesTotal": 250000,
    "cardSalesTotal": 150000,
    "totalSales": 400000,
    "expectedCash": 350000,
    "actualCash": 348000,
    "cashDifference": -2000,
    "notes": "Faltante de caja",
    "status": "closed",
    "createdAt": "2025-03-07T08:00:00.000Z",
    "updatedAt": "2025-03-07T18:00:00.000Z"
  },
  ...
]
```
- `500`: Error en el servidor.

---

### 6.2 Obtener Sesión POS por ID
**Método:** `GET`  
**Ruta:** `/api/pos-sessions/:id`  
**Descripción:** Obtiene una sesión POS específica por su ID.  

**Parámetros:**
- `id`: ID de la sesión POS (String).

**Respuesta:**
- `200`: Sesión POS encontrada.
```json
{
  "_id": "sessionId",
  "user": {
    "_id": "userId",
    "name": "Nombre Usuario",
    "email": "usuario@ejemplo.com"
  },
  "openingDate": "2025-03-07T08:00:00.000Z",
  "closingDate": "2025-03-07T18:00:00.000Z",
  "initialCash": 100000,
  "sales": [
    {
      "_id": "saleId1",
      "items": [
        {
          "product": {
            "_id": "productId",
            "name": "Producto Ejemplo",
            "salePrice": 5000
          },
          "quantity": 2,
          "variant": {
            "color": "Rojo",
            "size": "M"
          },
          "salePrice": 5000
        }
      ],
      "totalAmount": 10000,
      "paymentMethod": "cash",
      "saleDate": "2025-03-07T10:30:00.000Z"
    },
    ...
  ],
  "cashSalesTotal": 250000,
  "cardSalesTotal": 150000,
  "totalSales": 400000,
  "expectedCash": 350000,
  "actualCash": 348000,
  "cashDifference": -2000,
  "notes": "Faltante de caja",
  "status": "closed",
  "createdAt": "2025-03-07T08:00:00.000Z",
  "updatedAt": "2025-03-07T18:00:00.000Z"
}
```
- `404`: Sesión POS no encontrada.
- `500`: Error en el servidor.

---

### 6.3 Obtener Sesión Abierta de un Usuario
**Método:** `GET`  
**Ruta:** `/api/pos-sessions/user/:userId/open`  
**Descripción:** Obtiene la sesión POS abierta de un usuario específico.  

**Parámetros:**
- `userId`: ID del usuario (String).

**Respuesta:**
- `200`: Sesión abierta encontrada.
```json
{
  "hasOpenSession": true,
  "session": {
    "_id": "sessionId",
    "user": {
      "_id": "userId",
      "name": "Nombre Usuario",
      "email": "usuario@ejemplo.com"
    },
    "openingDate": "2025-03-07T08:00:00.000Z",
    "initialCash": 100000,
    "sales": ["saleId1", "saleId2", ...],
    "cashSalesTotal": 150000,
    "cardSalesTotal": 75000,
    "totalSales": 225000,
    "expectedCash": 250000,
    "status": "open",
    "createdAt": "2025-03-07T08:00:00.000Z",
    "updatedAt": "2025-03-07T15:30:00.000Z"
  }
}
```
- `404`: No hay sesión abierta para el usuario.
```json
{
  "msg": "No hay sesión abierta para este usuario",
  "hasOpenSession": false
}
```
- `500`: Error en el servidor.

---

### 6.4 Abrir Sesión POS (Abrir Caja)
**Método:** `POST`  
**Ruta:** `/api/pos-sessions/open`  
**Descripción:** Abre una nueva sesión POS (caja).  
**Parámetros:**
- `initialCash`: Monto inicial de efectivo en caja (Number).

**Ejemplo de Body:**
```json
{
  "initialCash": 100000
}
```

**Respuesta:**
- `201`: Sesión POS abierta exitosamente.
```json
{
  "msg": "Sesión de caja abierta correctamente",
  "session": {
    "_id": "sessionId",
    "user": "userId",
    "openingDate": "2025-03-07T08:00:00.000Z",
    "initialCash": 100000,
    "sales": [],
    "cashSalesTotal": 0,
    "cardSalesTotal": 0,
    "totalSales": 0,
    "expectedCash": 100000,
    "status": "open",
    "createdAt": "2025-03-07T08:00:00.000Z",
    "updatedAt": "2025-03-07T08:00:00.000Z"
  }
}
```
- `400`: Error en la solicitud (por ejemplo, ya existe una sesión abierta).
- `500`: Error en el servidor.

---

### 6.5 Cerrar Sesión POS (Cerrar Caja)
**Método:** `POST`  
**Ruta:** `/api/pos-sessions/close`  
**Descripción:** Cierra una sesión POS (caja) existente.  
**Parámetros:**
- `sessionId`: ID de la sesión a cerrar (String).
- `actualCash`: Monto real de efectivo en caja al cierre (Number).
- `notes`: Observaciones del cierre (String, opcional).

**Ejemplo de Body:**
```json
{
  "sessionId": "sessionId",
  "actualCash": 348000,
  "notes": "Faltante de caja de 2000"
}
```

**Respuesta:**
- `200`: Sesión POS cerrada exitosamente.
```json
{
  "msg": "Sesión de caja cerrada correctamente",
  "session": {
    "_id": "sessionId",
    "user": "userId",
    "openingDate": "2025-03-07T08:00:00.000Z",
    "closingDate": "2025-03-07T18:00:00.000Z",
    "initialCash": 100000,
    "sales": ["saleId1", "saleId2", ...],
    "cashSalesTotal": 250000,
    "cardSalesTotal": 150000,
    "totalSales": 400000,
    "expectedCash": 350000,
    "actualCash": 348000,
    "cashDifference": -2000,
    "notes": "Faltante de caja de 2000",
    "status": "closed",
    "createdAt": "2025-03-07T08:00:00.000Z",
    "updatedAt": "2025-03-07T18:00:00.000Z"
  }
}
```
- `400`: Error en la solicitud (por ejemplo, sesión ya cerrada).
- `404`: Sesión no encontrada.
- `500`: Error en el servidor.

---

### 6.6 Actualizar Sesión POS
**Método:** `PUT`  
**Ruta:** `/api/pos-sessions/:id`  
**Descripción:** Actualiza una sesión POS existente.  

**Parámetros:**
- `id`: ID de la sesión POS (String).
- `notes`: Observaciones (String).

**Ejemplo de Body:**
```json
{
  "notes": "Observaciones actualizadas"
}
```

**Respuesta:**
- `200`: Sesión POS actualizada.
```json
{
  "msg": "Sesión actualizada correctamente",
  "session": {
    "_id": "sessionId",
    "user": "userId",
    "openingDate": "2025-03-07T08:00:00.000Z",
    "initialCash": 100000,
    "sales": ["saleId1", "saleId2", ...],
    "cashSalesTotal": 150000,
    "cardSalesTotal": 75000,
    "totalSales": 225000,
    "expectedCash": 250000,
    "notes": "Observaciones actualizadas",
    "status": "open",
    "createdAt": "2025-03-07T08:00:00.000Z",
    "updatedAt": "2025-03-07T15:45:00.000Z"
  }
}
```
- `400`: Error en la solicitud (por ejemplo, intentar actualizar una sesión cerrada).
- `404`: Sesión POS no encontrada.
- `500`: Error en el servidor.
