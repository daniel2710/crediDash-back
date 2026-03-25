# Endpoint: Obtener Todos los Clientes de un Workspace

## Descripción
Este endpoint permite obtener todos los clientes asociados a un workspace específico, con soporte para paginación y búsqueda por término.

## Detalles del Endpoint

**Método:** `GET`  
**Ruta:** `/clients/workspace/:workspaceId`

## Parámetros

### Parámetros de Ruta (Path Parameters)
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `workspaceId` | string | Sí | ID del workspace del cual se desean obtener los clientes |

### Parámetros de Consulta (Query Parameters)
| Parámetro | Tipo | Requerido | Valor por Defecto | Descripción |
|-----------|------|-----------|-------------------|-------------|
| `page` | number | No | 1 | Número de página actual para la paginación |
| `limit` | number | No | 15 | Cantidad de clientes por página |
| `search` | string | No | - | Término de búsqueda para filtrar clientes por nombre, correo, teléfono o dirección |

## Funcionalidad de Búsqueda

El parámetro `search` permite realizar búsquedas en los siguientes campos del cliente:
- **Nombre** (`name`)
- **Correo electrónico** (`email`)
- **Teléfono** (`phone`)
- **Dirección** (`address`)

La búsqueda es **case-insensitive** (no distingue mayúsculas de minúsculas) y utiliza coincidencias parciales (regex).

## Respuestas

### Respuesta Exitosa (200 OK)
```json
{
  "status": "success",
  "clients": [
    {
      "_id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "workspaceId": "string",
      "lastLoan": {
        "fecha_ultimo_prestamo": "2026-03-25T19:30:00.000Z",
        "deuda_a_la_fecha": 5000,
        "total_abonado": 3000,
        "estado_prestamo": "partial"
      },
      ...
    }
  ],
  "current_page": 1,
  "total_pages": 5,
  "next": "string | null",
  "previous": "string | null",
  "total_items": 75,
  "items_on_page": 15
}
```

#### Campos del Objeto `lastLoan`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha_ultimo_prestamo` | Date | Fecha de creación del último préstamo del cliente |
| `deuda_a_la_fecha` | number | Monto pendiente por pagar del préstamo |
| `total_abonado` | number | Total pagado hasta la fecha del préstamo |
| `estado_prestamo` | string | Estado actual del préstamo: `pending`, `liquidated`, `partial`, `late` |

**Nota:** Si el cliente no tiene préstamos, el campo `lastLoan` será `null`.

### Errores Posibles

#### 400 Bad Request
```json
{
  "status": "failed",
  "message": "workspaceId is required"
}
```
o
```json
{
  "status": "failed",
  "message": "There are no results on the current page."
}
```

#### 404 Not Found
```json
{
  "status": "failed",
  "message": "Workspace not found"
}
```

#### 500 Internal Server Error
```json
{
  "status": "failed",
  "message": "Failed to fetch clients"
}
```

## Ejemplos de Uso

### Obtener clientes sin filtros
```
GET /clients/workspace/507f1f77bcf86cd799439011?page=1&limit=15
```

### Obtener clientes con búsqueda por nombre
```
GET /clients/workspace/507f1f77bcf86cd799439011?search=Juan&page=1&limit=15
```

### Obtener clientes con búsqueda por correo
```
GET /clients/workspace/507f1f77bcf86cd799439011?search=example@mail.com
```

### Obtener clientes con búsqueda por teléfono
```
GET /clients/workspace/507f1f77bcf86cd799439011?search=555-1234
```

## Notas Adicionales

- La paginación incluye URLs para las páginas siguiente (`next`) y anterior (`previous`) cuando están disponibles
- Si se solicita una página que no existe (y no es la primera página), se retorna un error 400
- El workspace debe existir en la base de datos, de lo contrario se retorna un error 404
- La búsqueda filtra los resultados antes de aplicar la paginación, por lo que `total_items` reflejará el total de clientes que coinciden con el término de búsqueda
