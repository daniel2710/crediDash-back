# Endpoints de Clientes

## 1. Modificar Cliente (Update)

### Endpoint
```
PATCH /clients/:workspaceId/:clientId
```

### Parámetros de URL
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `workspaceId` | string | ID del workspace al que pertenece el cliente |
| `clientId` | string | ID del cliente a modificar |

### Headers Requeridos
```
Authorization: Bearer <token>
```

### Body (JSON)
Se pueden enviar uno o más campos a actualizar:

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | No | Nombre del cliente |
| `lastname` | string | No | Apellido del cliente |
| `email` | string | No | Correo electrónico del cliente |
| `phone` | string | No | Teléfono del cliente |
| `address` | string | No | Dirección del cliente |
| `description` | string | No | Descripción adicional del cliente |

### Ejemplo de Request
```json
{
  "name": "Juan",
  "lastname": "Pérez",
  "email": "juan.perez@email.com",
  "phone": "+573001234567",
  "address": "Calle 123 # 45-67",
  "description": "Cliente actualizado"
}
```

### Respuesta Exitosa (200 OK)
```json
{
  "status": "success",
  "message": "Client updated successfully",
  "client": {
    "_id": "clientId",
    "workspaceId": "workspaceId",
    "name": "Juan",
    "lastname": "Pérez",
    "email": "juan.perez@email.com",
    "phone": "+573001234567",
    "address": "Calle 123 # 45-67",
    "description": "Cliente actualizado",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Errores Posibles
| Código | Mensaje | Descripción |
|--------|---------|-------------|
| 400 | "workspaceId is required" | No se proporcionó el workspaceId en los parámetros |
| 404 | "Workspace not found" | El workspace no existe |
| 404 | "Client not found" | El cliente no existe |
| 403 | "Client does not belong to the provided workspace" | El cliente no pertenece al workspace indicado |
| 500 | "An unexpected error occurred" | Error interno del servidor |

---

## 2. Eliminar Cliente (Delete)

### Endpoint
```
DELETE /clients/delete/:clientId/:userId
```

### Parámetros de URL
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `clientId` | string | ID del cliente a eliminar |
| `userId` | string | ID del usuario propietario del workspace |

### Headers Requeridos
```
Authorization: Bearer <token>
```

### Ejemplo de Request
```
DELETE /clients/delete/60d21b4667d0d8992e610c85/60d21b4667d0d8992e610c85
```

### Respuesta Exitosa (200 OK)
```json
{
  "status": "success",
  "message": "Client deleted successfully.",
  "client": {
    "_id": "60d21b4667d0d8992e610c85",
    "workspaceId": "60d21b4667d0d8992e610c86",
    "name": "Juan",
    "lastname": "Pérez",
    "email": "juan.perez@email.com",
    "phone": "+573001234567",
    "address": "Calle 123 # 45-67",
    "description": "Cliente a eliminar",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Errores Posibles
| Código | Mensaje | Descripción |
|--------|---------|-------------|
| 400 | "clientId and userId are required" | Faltan parámetros obligatorios |
| 404 | "Client not found" | El cliente no existe |
| 404 | "Workspace not found" | El workspace asociado al cliente no existe |
| 403 | "This workspace does not belong to this user" | El usuario no es propietario del workspace |
| 409 | "Client has active loans and cannot be deleted" | El cliente tiene préstamos activos (`pending`, `partial` o `late`) |
| 500 | "An unexpected error occurred" | Error interno del servidor |

### Notas Importantes
- **No se puede eliminar** un cliente que tenga préstamos con estado `pending`, `partial` o `late`. Primero se deben liquidar o archivar al cliente.
- Al eliminar un cliente sin préstamos activos, los préstamos liquidados asociados también se eliminan automáticamente.
- El cliente eliminado se devuelve en la respuesta para referencia.

---

## 3. Archivar / Desarchivar Cliente

### Endpoint
```
PATCH /clients/:workspaceId/:clientId/archive
```

Actúa como toggle: si el cliente está activo lo archiva, si está archivado lo desarchiva.

### Parámetros de URL
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `workspaceId` | string | ID del workspace al que pertenece el cliente |
| `clientId` | string | ID del cliente a archivar/desarchivar |

### Headers Requeridos
```
Authorization: Bearer <token>
```

### Respuesta Exitosa (200 OK)
```json
{
  "status": "success",
  "message": "Client archived successfully",
  "client": {
    "_id": "60d21b4667d0d8992e610c85",
    "workspaceId": "60d21b4667d0d8992e610c86",
    "name": "Juan",
    "lastname": "Pérez",
    "isArchived": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

El campo `message` será:
- `"Client archived successfully"` cuando `isArchived` pasa a `true`
- `"Client unarchived successfully"` cuando `isArchived` pasa a `false`

### Errores Posibles
| Código | Mensaje | Descripción |
|--------|---------|-------------|
| 404 | "Client not found" | El cliente no existe |
| 404 | "Workspace not found" | El workspace no existe |
| 403 | "The client does not belong to the specified workspace" | El cliente no pertenece al workspace |
| 500 | "An unexpected error occurred" | Error interno del servidor |

---

## Campo `isArchived` en el esquema

El esquema de cliente ahora incluye:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `isArchived` | boolean | `false` | Indica si el cliente está archivado |

---

## Filtro `archived` en GET /clients/:workspaceId

El endpoint de listado acepta el query param `archived` para filtrar por estado de archivo:

| Valor | Comportamiento |
|-------|----------------|
| `archived=true` | Devuelve solo clientes archivados (`isArchived: true`) |
| `archived=false` | Devuelve solo clientes activos (`isArchived: false` o sin el campo) |
| _(omitido)_ | Devuelve todos los clientes sin importar su estado de archivo |

### Ejemplos

```
# Solo clientes activos
GET /clients/64abc...?archived=false

# Solo clientes archivados
GET /clients/64abc...?archived=true

# Combinado con búsqueda
GET /clients/64abc...?archived=false&search=juan
```

---

## Campo `has_active_loans` en GET /clients/:workspaceId

La respuesta de listado de clientes incluye el campo `has_active_loans` por cada cliente:

```json
{
  "status": "success",
  "clients": [
    {
      "_id": "...",
      "name": "Juan",
      "lastname": "Pérez",
      "isArchived": false,
      "has_active_loans": true,
      "lastLoan": { ... }
    }
  ]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `has_active_loans` | boolean | `true` si el cliente tiene al menos un préstamo con estado `pending`, `partial` o `late` |

---

## Middleware de Autenticación

Todos los endpoints requieren autenticación. Se debe incluir el token JWT en el header `Authorization`:

```
Authorization: Bearer <token_jwt>
```

Si no se proporciona el token o es inválido, se retornará error 401.
