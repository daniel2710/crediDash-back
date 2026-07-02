# Endpoint: GET /statistics/progress/:userId

## Descripción General

Devuelve estadísticas de progreso de cobro para un usuario en un rango de tiempo determinado. Permite saber cuánto se debía cobrar, cuánto se cobró efectivamente y cuál es el saldo pendiente dentro del período seleccionado.

---

## Definición de Ruta

```
GET /statistics/progress/:userId?filter=<week|month>
```

| Componente     | Valor                              |
|----------------|------------------------------------|
| Método         | `GET`                              |
| Ruta           | `/statistics/progress/:userId`     |
| Autenticación  | Requerida (`isAuthenticated`)      |
| Parámetro URL  | `userId` — MongoDB ObjectId        |
| Query param    | `filter` — `"week"` o `"month"` (default: `"month"`) |

---

## Capas de la Solicitud

```
Cliente HTTP
    │
    ▼
Middleware: isAuthenticated          ← Valida cookie CREDIDASH-AUTH
    │
    ▼
Controller: getProgress              ← Valida params, busca usuario
    │
    ▼
Service: getProgressStatistics       ← Lógica de negocio y cálculo
    │
    ▼
MongoDB (WorkspaceSchema, LoansSchema)
```

---

## Middleware: `isAuthenticated`

Antes de llegar al controlador, cada request pasa por este middleware:

1. Lee la cookie `CREDIDASH-AUTH` de la request.
2. Busca un usuario en BD cuyo `authentication.sessionToken` coincida.
3. Si el token **ya expiró** → responde `401` con mensaje `"Session expired. Please login again."`.
4. Si el token **expira en menos de 1 hora** → lo renueva automáticamente (nuevo token + nueva cookie con 8 horas de vida).
5. Si todo es válido → inyecta el usuario en `req.identity` y continúa al controlador.

---

## Controlador: `getProgress`

Archivo: `src/controllers/statistics/getProgress.ts`

### Pasos de validación

1. **Extrae** `userId` de `req.params` y `filter` de `req.query` (default `'month'`).
2. **Valida el filtro**: solo acepta `"week"` o `"month"`. Si es otro valor → `400 Bad Request`.
3. **Valida el `userId`**: usa `validateObjectId` para verificar que sea un ObjectId válido de MongoDB. Si no → `400 Bad Request`.
4. **Verifica existencia del usuario** en `UserSchema`. Si no existe → `404 Not Found`.
5. Llama al servicio `getProgressStatistics(userId, timeFilter)`.
6. Si el servicio lanza `"No workspaces found for this user"` → responde `404`. Cualquier otro error → `500`.

---

## Servicio: `getProgressStatistics`

Archivo: `src/services/statistics/getProgress.service.ts`

### Lógica paso a paso

#### 1. Obtener workspaces del usuario

```ts
const workspaces = await WorkspaceSchema.find({ userId });
```

Si el usuario no tiene ningún workspace → lanza error `"No workspaces found for this user"`.

#### 2. Calcular el rango de fechas

```ts
const now = new Date();
const startDate = new Date();

if (timeFilter === 'week')  startDate.setDate(now.getDate() - 7);
if (timeFilter === 'month') startDate.setMonth(now.getMonth() - 1);
```

| Filtro   | `startDate`            | `endDate` |
|----------|------------------------|-----------|
| `week`   | Hoy − 7 días           | Hoy       |
| `month`  | Hoy − 1 mes calendario | Hoy       |

#### 3. Obtener todos los préstamos de los workspaces

```ts
const loans = await LoansSchema.find({
    workspaceId: { $in: workspaceIds }
});
```

Trae **todos** los préstamos sin importar su estado.

#### 4. Iterar cuotas (`installments`) y acumular totales

Por cada préstamo, se itera sobre su array de cuotas (`loan.installments`). Una cuota se **incluye en el cálculo** solo si su `end_date` cae dentro del rango `[startDate, now]`:

```ts
if (endDate >= startDate && endDate <= now) {
    totalToCollect += installment.amount;      // Lo que se debía cobrar

    if (installment.payment > 0) {
        totalCollected += installment.payment; // Lo que se cobró
    }
}
```

> **Nota**: El filtro es por `end_date` (fecha de vencimiento de la cuota), no por la fecha en que se realizó el pago.

#### 5. Calcular saldo pendiente y porcentaje

```
pendingBalance       = totalToCollect - totalCollected
collectionPercentage = (totalCollected / totalToCollect) × 100
```

Si `totalToCollect === 0`, el porcentaje retorna `"0.00"` para evitar división por cero.

---

## Respuesta Exitosa

**HTTP 200**

```json
{
  "status": "success",
  "data": {
    "timeFilter": "month",
    "startDate": "2026-06-01T00:00:00.000Z",
    "endDate": "2026-07-01T00:00:00.000Z",
    "statistics": {
      "totalToCollect": 5000,
      "totalCollected": 3500,
      "pendingBalance": 1500,
      "collectionPercentage": "70.00"
    }
  }
}
```

| Campo                 | Tipo     | Descripción                                              |
|-----------------------|----------|----------------------------------------------------------|
| `timeFilter`          | `string` | Filtro aplicado: `"week"` o `"month"`                    |
| `startDate`           | `Date`   | Fecha de inicio del rango analizado                      |
| `endDate`             | `Date`   | Fecha de fin del rango (momento de la consulta)          |
| `totalToCollect`      | `number` | Suma de `amount` de cuotas con vencimiento en el rango   |
| `totalCollected`      | `number` | Suma de `payment` de esas cuotas que tienen pago > 0     |
| `pendingBalance`      | `number` | `totalToCollect - totalCollected`                        |
| `collectionPercentage`| `string` | Porcentaje cobrado sobre lo esperado (2 decimales)       |

---

## Respuestas de Error

| HTTP | Causa                                          |
|------|------------------------------------------------|
| `400` | `filter` no es `"week"` ni `"month"`          |
| `400` | `userId` no es un ObjectId válido de MongoDB  |
| `401` | Sin cookie de sesión o token expirado         |
| `404` | Usuario no encontrado en BD                   |
| `404` | Usuario no tiene workspaces                   |
| `500` | Error interno inesperado                      |

---

## Diagrama de Flujo

```
Request GET /statistics/progress/:userId?filter=month
        │
        ├─ ¿Cookie CREDIDASH-AUTH presente? ──No──► 401
        │
        ├─ ¿Token expirado? ──────────────────Yes──► 401 "Session expired"
        │
        ├─ ¿Token por expirar (<1h)? ─────────Yes──► Renovar token automáticamente
        │
        ├─ ¿filter válido? ───────────────────No───► 400 "Invalid filter"
        │
        ├─ ¿userId es ObjectId válido? ───────No───► 400 "Invalid or missing userId"
        │
        ├─ ¿Usuario existe en BD? ────────────No───► 404 "User not found"
        │
        ├─ ¿Tiene workspaces? ────────────────No───► 404 "No workspaces found"
        │
        ├─ Obtener todos los préstamos de los workspaces
        │
        ├─ Calcular rango de fechas (week = -7d / month = -1 mes)
        │
        ├─ Filtrar cuotas cuyo end_date caiga dentro del rango
        │
        ├─ Sumar amount → totalToCollect
        ├─ Sumar payment (si > 0) → totalCollected
        ├─ pendingBalance = totalToCollect - totalCollected
        ├─ collectionPercentage = (totalCollected / totalToCollect) * 100
        │
        └──► 200 { status, data: { timeFilter, startDate, endDate, statistics } }
```

---

## Consideraciones y Comportamiento Notable

- **Scope multi-workspace**: El cálculo agrega datos de **todos** los workspaces del usuario, no de uno individual.
- **Filtro por vencimiento, no por pago**: Una cuota se incluye si su `end_date` cae en el rango, independientemente de cuándo se realizó el pago.
- **Préstamos sin estado**: Se incluyen préstamos de cualquier estado (`pending`, `partial`, `liquidated`, `late`).
- **Cuotas sin pago**: Si `installment.payment === 0`, se suman al `totalToCollect` pero no a `totalCollected`, aumentando el `pendingBalance`.
- **Renovación de token transparente**: El middleware renueva la sesión automáticamente si queda menos de 1 hora, sin interrumpir la request.
