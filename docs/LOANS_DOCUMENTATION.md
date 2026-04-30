# Documentación del Sistema de Préstamos

## Índice
- [Resumen](#resumen)
- [Funcionamiento](#funcionamiento)
- [Campos del Préstamo](#campos-del-préstamo)
- [Validaciones](#validaciones)
- [Casos de Uso](#casos-de-uso)
- [Respuestas de Error](#respuestas-de-error)

---

## Resumen

El sistema de préstamos permite crear préstamos financieros con dos modalidades:

1. **Préstamo con cuotas automáticas**: Se define el número de cuotas y el sistema genera automáticamente el plan de pagos.
2. **Préstamo sin cuotas definidas**: No se especifica `installments_qty`, permitiendo al usuario agregar cuotas manualmente de forma flexible.

---

## Funcionamiento

### Flujo de Creación

```
1. Validación de campos obligatorios (workspaceId, clientId, amount)
2. Validación de campos opcionales (status, interest, installments_qty, payment_frequency)
3. Verificación de existencia de Workspace y Client
4. Verificación de pertenencia del cliente al workspace
5. Cálculo del monto total con intereses
6. Generación de cuotas (solo si se proporciona installments_qty)
7. Creación del préstamo en base de datos
8. Actualización de estadísticas del workspace
```

### Cálculo de Montos

```
totalAmount = amount + (amount * (interest / 100))
amountPerQuota = totalAmount / installments_qty
```

**Ejemplo:**
- Monto: $1,000
- Interés: 10%
- Total a pagar: $1,100
- Cuotas: 10
- Monto por cuota: $110

---

## Campos del Préstamo

### Campos Obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `workspaceId` | string (ObjectId) | ID del workspace al que pertenece el préstamo |
| `clientId` | string (ObjectId) | ID del cliente que recibe el préstamo |
| `amount` | number | Monto principal del préstamo |

### Campos Opcionales

| Campo | Tipo | Descripción | Valor por Defecto |
|-------|------|-------------|-------------------|
| `status` | string | Estado inicial del préstamo | `'pending'` |
| `interest` | number | Porcentaje de interés aplicado | `0` |
| `installments_qty` | number | Cantidad de cuotas a generar | `undefined` |
| `payment_frequency` | string | Frecuencia de pago de las cuotas | `null` |
| `description` | string | Descripción opcional del préstamo | `undefined` |
| `start_date` | string (Date) | Fecha de inicio del préstamo | Fecha actual |

### Estados Válidos

- `pending`: Préstamo pendiente de pago
- `partial`: Préstamo con pagos parciales
- `liquidated`: Préstamo completamente pagado
- `late`: Préstamo con cuotas atrasadas

### Frecuencias de Pago

| Valor | Descripción |
|-------|-------------|
| `diary` | Pagos diarios |
| `weekly` | Pagos semanales (cada 7 días) |
| `fortnightly` | Pagos quincenales (cada 15 días) |
| `monthly` | Pagos mensuales (cada 30 días) |

---

## Validaciones

### Validaciones de Campos

| Campo | Validación | Error |
|-------|------------|-------|
| `workspaceId` | Requerido, ObjectId válido | `Missing or invalid fields: workspaceId` |
| `clientId` | Requerido, ObjectId válido | `Missing or invalid fields: clientId` |
| `amount` | Requerido, número >= 0 | `Missing or invalid fields: amount` |
| `installments_qty` | Opcional, número >= 1 | `installments_qty must be at least 1` |
| `interest` | Número >= 0 | `Invalid or missing numeric value for field: interest` |
| `payment_frequency` | Uno de: `diary`, `weekly`, `fortnightly`, `monthly` | `Invalid payment_frequency...` |
| `status` | Uno de: `pending`, `liquidated`, `partial`, `late` | `Invalid status...` |

### Validaciones de Negocio

| Validación | Descripción | Error |
|------------|-------------|-------|
| Workspace existe | Verifica que el workspace exista en BD | `Workspace not found` |
| Cliente existe | Verifica que el cliente exista en BD | `Client not found` |
| Pertenencia | Verifica que el cliente pertenezca al workspace | `The client does not belong to the specified workspace` |
| Préstamo liquidado | Impide pagos adicionales cuando `payment_missing === 0` | `the loan has already been paid.` |

---

## Casos de Uso

### Caso 1: Préstamo Simple con Cuotas Automáticas

**Escenario:** Cliente necesita $1,000 para una emergencia médica, pagadero en 5 cuotas semanales con 5% de interés.

```json
{
  "workspaceId": "workspace123",
  "clientId": "client456",
  "amount": 1000,
  "interest": 5,
  "installments_qty": 5,
  "payment_frequency": "weekly",
  "description": "Préstamo emergencia médica"
}
```

**Resultado:**
- Total a pagar: $1,050
- 5 cuotas de $210 cada una
- Fechas: semanalmente desde el día siguiente
- Estado inicial: `pending`

---

### Caso 2: Préstamo sin Cuotas Definidas (Flexible)

**Escenario:** Cliente de confianza con pago flexible. El prestamista quiere acordar cuotas según la capacidad de pago del cliente mes a mes.

```json
{
  "workspaceId": "workspace123",
  "clientId": "client789",
  "amount": 5000,
  "interest": 10,
  "description": "Préstamo flexible - capital de trabajo"
}
```

**Resultado:**
- Total a pagar: $5,500
- Array de cuotas vacío: `[]`
- El usuario puede agregar cuotas manualmente después
- Estado inicial: `pending`

---

### Caso 3: Préstamo Diario para Comerciante

**Escenario:** Comerciante necesita $500 para inventario. Pagará $50 diarios hasta completar.

```json
{
  "workspaceId": "workspace123",
  "clientId": "client101",
  "amount": 500,
  "interest": 0,
  "installments_qty": 10,
  "payment_frequency": "diary",
  "description": "Inventario tienda"
}
```

**Resultado:**
- Total a pagar: $500 (sin intereses)
- 10 cuotas de $50
- Fechas: 10 días consecutivos desde mañana
- Estado inicial: `pending`

---

### Caso 4: Préstamo Mensual con Fecha Específica

**Escenario:** Préstamo hipotecario con fecha de inicio específica.

```json
{
  "workspaceId": "workspace123",
  "clientId": "client202",
  "amount": 10000,
  "interest": 8,
  "installments_qty": 12,
  "payment_frequency": "monthly",
  "start_date": "2024-01-01",
  "description": "Préstamo hipotecario"
}
```

**Resultado:**
- Total a pagar: $10,800
- 12 cuotas mensuales de $900
- Primera cuota: 2024-01-02 (día siguiente)
- Última cuota: ~2024-12-02
- Estado inicial: `pending`

---

### Caso 5: Préstamo sin Intereses y sin Frecuencia

**Escenario**: Préstamo entre amigos sin intereses, sin fechas definidas.

```json
{
  "workspaceId": "workspace123",
  "clientId": "client303",
  "amount": 200,
  "installments_qty": 4
}
```

**Resultado:**
- Total a pagar: $200
- 4 cuotas de $50 cada una
- Sin fechas de vencimiento (null)
- Estado inicial: `pending`

---

### Caso 6: Préstamo con Estado Inicial Personalizado

**Escenario:** Préstamo que ya tiene un pago registrado previamente.

```json
{
  "workspaceId": "workspace123",
  "clientId": "client404",
  "amount": 3000,
  "interest": 5,
  "installments_qty": 6,
  "payment_frequency": "fortnightly",
  "status": "partial",
  "description": "Préstamo con abono inicial"
}
```

**Resultado:**
- Total a pagar: $3,150
- 6 cuotas quincenales
- Estado inicial: `partial` (en lugar de pending)

---

### Caso 7: Préstamo Flexible para Cliente VIP

**Escenario:** Cliente VIP con préstamo grande y términos negociables.

```json
{
  "workspaceId": "workspaceVIP",
  "clientId": "clientVIP001",
  "amount": 20000,
  "interest": 15,
  "description": "Préstamo VIP - términos a negociar"
}
```

**Nota:** No se incluye `installments_qty`, permitiendo al administrador definir cuotas personalizadas según las negociaciones con el cliente.

---

## Respuestas de Error

### 400 - Bad Request

```json
{
  "status": "failed",
  "message": "Missing or invalid fields: installments_qty"
}
```

### 403 - Forbidden

```json
{
  "status": "failed",
  "message": "The client does not belong to the specified workspace"
}
```

### 404 - Not Found

```json
{
  "status": "failed",
  "message": "Workspace not found"
}
```

### 500 - Internal Server Error

```json
{
  "status": "failed",
  "message": "An unexpected error occurred"
}
```

---

## Estructura de Respuesta Exitosa

```json
{
  "status": "success",
  "message": "Loan and installments created successfully",
  "loan": {
    "_id": "loan123",
    "workspaceId": "workspace123",
    "clientId": "client456",
    "status": "pending",
    "description": "Préstamo emergencia médica",
    "amount": 1000,
    "interest": 5,
    "installments_qty": 5,
    "installments_info": {
      "paid_installments": 0
    },
    "installments": [
      {
        "status": "pending",
        "amount": 210,
        "payment_date": null,
        "end_date": "2024-01-08T00:00:00.000Z"
      }
    ],
    "payment_actual": 0,
    "payment_missing": 1050,
    "payment_frequency": "weekly",
    "start_date": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Notas Importantes

1. **Cuotas Manuales**: Cuando se crea un préstamo sin `installments_qty`, las cuotas deben agregarse manualmente a través del endpoint correspondiente.

2. **Validación de Liquidación**: El sistema impide agregar más pagos cuando un préstamo tiene `payment_missing === 0`.

3. **Fechas**: Las fechas de vencimiento se calculan desde el día siguiente a la fecha de inicio para evitar vencimientos inmediatos.

4. **Estadísticas**: La creación de un préstamo actualiza automáticamente las estadísticas del workspace:
   - Incrementa `total_loans`
   - Incrementa `active_loans`
   - Incrementa `total_lents`
   - Incrementa `total_pending`
