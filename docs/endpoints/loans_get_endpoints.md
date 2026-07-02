# Loans GET Endpoints

## 1. GET /loans/workspace/:workspaceId/:userId

Obtiene todos los préstamos de un workspace con soporte de filtros y paginación.

**Requiere autenticación:** Sí (`Authorization: Bearer <token>`)

### Path Parameters

| Parámetro     | Tipo     | Requerido | Descripción                        |
|---------------|----------|-----------|------------------------------------|
| `workspaceId` | ObjectId | Sí        | ID del workspace                   |
| `userId`      | ObjectId | Sí        | ID del usuario dueño del workspace |

### Query Parameters

| Parámetro          | Tipo     | Requerido | Descripción                                                        |
|--------------------|----------|-----------|--------------------------------------------------------------------|
| `page`             | number   | No        | Página actual (default: `1`)                                       |
| `limit`            | number   | No        | Resultados por página (default: `15`)                              |
| `client`           | ObjectId | No        | Filtra préstamos por ID del cliente                                |
| `status`           | string   | No        | Filtra por estado: `pending`, `liquidated`, `partial`, `late`      |
| `payment_frequency`| string   | No        | Filtra por frecuencia: `diary`, `weekly`, `fortnightly`, `monthly` |
| `start_date_from`  | ISO 8601 | No        | Fecha de inicio mínima (ej. `2025-01-01`)                          |
| `start_date_to`    | ISO 8601 | No        | Fecha de inicio máxima (ej. `2025-12-31`)                          |
| `search`           | string   | No        | Busca por descripción del préstamo o nombre/apellido del cliente   |

### Ejemplos de uso

```
# Sin filtros
GET /loans/workspace/64abc.../64xyz...

# Solo préstamos atrasados
GET /loans/workspace/64abc.../64xyz...?status=late

# Por cliente y frecuencia semanal
GET /loans/workspace/64abc.../64xyz...?client=64cde...&payment_frequency=weekly

# Rango de fechas
GET /loans/workspace/64abc.../64xyz...?start_date_from=2025-01-01&start_date_to=2025-06-30

# Buscar por nombre de cliente o descripción
GET /loans/workspace/64abc.../64xyz...?search=juan

# Combinado con paginación
GET /loans/workspace/64abc.../64xyz...?status=pending&payment_frequency=monthly&page=2&limit=10
```

### Respuesta exitosa `200`

```json
{
    "status": "success",
    "loans": [...],
    "current_page": 1,
    "total_pages": 3,
    "next": true,
    "previous": false,
    "total_items": 42,
    "items_on_page": 15
}
```

---

## 2. GET /loans/:workspaceId/:clientId

Obtiene todos los préstamos de un cliente específico con soporte de filtros y paginación.

**Requiere autenticación:** Sí (`Authorization: Bearer <token>`)

### Path Parameters

| Parámetro     | Tipo     | Requerido | Descripción       |
|---------------|----------|-----------|-------------------|
| `workspaceId` | ObjectId | Sí        | ID del workspace  |
| `clientId`    | ObjectId | Sí        | ID del cliente    |

### Query Parameters

| Parámetro          | Tipo     | Requerido | Descripción                                                        |
|--------------------|----------|-----------|--------------------------------------------------------------------|
| `page`             | number   | No        | Página actual (default: `1`)                                       |
| `limit`            | number   | No        | Resultados por página (default: `15`)                              |
| `status`           | string   | No        | Filtra por estado: `pending`, `liquidated`, `partial`, `late`      |
| `payment_frequency`| string   | No        | Filtra por frecuencia: `diary`, `weekly`, `fortnightly`, `monthly` |
| `start_date_from`  | ISO 8601 | No        | Fecha de inicio mínima (ej. `2025-01-01`)                          |
| `start_date_to`    | ISO 8601 | No        | Fecha de inicio máxima (ej. `2025-12-31`)                          |
| `search`           | string   | No        | Busca por descripción del préstamo (insensible a mayúsculas)       |

> **Nota:** Este endpoint no soporta los filtros `client` ni búsqueda por nombre de cliente ya que el cliente está fijo en el path parameter. El filtro `search` aplica únicamente sobre la descripción del préstamo.

### Ejemplos de uso

```
# Sin filtros
GET /loans/64abc.../64cde...

# Solo préstamos liquidados
GET /loans/64abc.../64cde...?status=liquidated

# Por frecuencia mensual
GET /loans/64abc.../64cde...?payment_frequency=monthly

# Rango de fechas
GET /loans/64abc.../64cde...?start_date_from=2025-03-01&start_date_to=2025-09-30

# Buscar por descripción
GET /loans/64abc.../64cde...?search=electrodomesticos

# Combinado con paginación
GET /loans/64abc.../64cde...?status=partial&start_date_from=2025-01-01&page=1&limit=5
```

### Respuesta exitosa `200`

```json
{
    "status": "success",
    "loans": [...],
    "current_page": 1,
    "total_pages": 2,
    "next": true,
    "previous": false,
    "total_items": 18,
    "items_on_page": 15
}
```

---

## Valores válidos para filtros

### `status`
| Valor        | Descripción                             |
|--------------|-----------------------------------------|
| `pending`    | Préstamo activo con cuotas pendientes   |
| `liquidated` | Préstamo completamente pagado           |
| `partial`    | Préstamo con pago parcial               |
| `late`       | Préstamo con cuotas vencidas            |

### `payment_frequency`
| Valor         | Descripción        |
|---------------|--------------------|
| `diary`       | Diaria             |
| `weekly`      | Semanal            |
| `fortnightly` | Quincenal          |
| `monthly`     | Mensual            |

---

## Errores comunes

| Código | Mensaje                                                               | Causa                                      |
|--------|-----------------------------------------------------------------------|--------------------------------------------|
| `400`  | `Invalid status filter. Allowed values: ...`                          | Valor de `status` no permitido             |
| `400`  | `Invalid payment_frequency filter. Allowed values: ...`               | Valor de `payment_frequency` no permitido  |
| `400`  | `Invalid ObjectId for client`                                         | `client` no es un ObjectId válido          |
| `403`  | `Workspace does not belong to the specified user`                     | El workspace no pertenece al usuario       |
| `403`  | `The client does not belong to the specified workspace`               | El cliente no pertenece al workspace       |
| `404`  | `Workspace not found` / `User not found` / `Client not found`        | Recurso no encontrado                      |
