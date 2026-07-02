# Endpoint de Pago de Cuotas

## Overview

El endpoint de pago de cuotas permite procesar pagos de préstamos de dos maneras diferentes: pagando una cuota específica por su ID o procesando la siguiente cuota pendiente en orden secuencial.

## Endpoint Details

- **URL**: `POST /installments/pay`
- **Método**: `POST`
- **Autenticación**: Requerida (middleware `isAuthenticated`)
- **Content-Type**: `application/json`

## Request Body

### Parámetros Obligatorios

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `loanId` | string | MongoDB ObjectId del préstamo |
| `workspaceId` | string | MongoDB ObjectId del workspace |
| `paymentAmount` | number | Monto del pago (debe ser mayor a 0) |

### Parámetros Opcionales

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `installmentId` | string | MongoDB ObjectId de la cuota específica a pagar |

## Modos de Pago

### 1. Pago de Cuota Específica

Cuando se proporciona `installmentId`, el sistema paga únicamente esa cuota.

```json
{
  "loanId": "69f2cbb9eab7586f57e9017b",
  "workspaceId": "69bc5079433eaa665ad95e32",
  "paymentAmount": 50000,
  "installmentId": "69c567cda9a74908ae68e3d8"
}
```

**Comportamiento:**
- Busca la cuota específica por su ID
- Valida que exista y no esté liquidada
- Si ya tiene un pago parcial, permite completarla
- El monto no puede exceder el saldo pendiente de esa cuota

### 2. Pago Estándar (Siguiente Cuota Pendiente)

Cuando NO se proporciona `installmentId`, el sistema procesa la siguiente cuota pendiente en orden.

```json
{
  "loanId": "69f2cbb9eab7586f57e9017b",
  "workspaceId": "69bc5079433eaa665ad95e32",
  "paymentAmount": 50000
}
```

**Comportamiento:**
- **Prioridad 1**: Completa cuotas parciales existentes
- **Prioridad 2**: Si no hay parciales, procesa la primera cuota pendiente
- Procesamiento secuencial (una cuota por petición)
- Si el monto es insuficiente para liquidar, deja la cuota en estado "partial"

## Response

### Response Exitoso (201)

```json
{
  "status": "success",
  "message": "Payment processed successfully",
  "updatedLoan": {
    "_id": "69f2cbb9eab7586f57e9017b",
    "status": "partial",
    "installments_info": {
      "paid_installments": 2
    },
    "installments": [
      {
        "_id": "69c567cda9a74908ae68e3d8",
        "status": "liquidated",
        "payment": 50000,
        "amount": 50000,
        "payment_date": "2026-05-06T00:14:07.318Z",
        "end_date": "2026-05-15T00:00:00.000Z"
      }
    ],
    "payment_actual": 50000,
    "payment_missing": 450000,
    "history": [
      {
        "payment_date": "2026-05-06T00:14:07.318Z",
        "payment": 50000,
        "remaining_balance": 450000,
        "paid_installments": 1,
        "loan_status": "partial",
        "paid_installment_ids": ["69c567cda9a74908ae68e3d8"],
        "installment_details": [
          {
            "installment_id": "69c567cda9a74908ae68e3d8",
            "amount_paid": 50000,
            "previous_status": "pending",
            "new_status": "liquidated"
          }
        ]
      }
    ]
  }
}
```

### Response de Error (400/404/500)

```json
{
  "status": "failed",
  "message": "Descripción del error"
}
```

## Validaciones

### Validaciones de Input

- `loanId`: Debe ser un MongoDB ObjectId válido
- `workspaceId`: Debe ser un MongoDB ObjectId válido  
- `paymentAmount`: Debe ser número mayor a 0
- `installmentId` (si se proporciona): Debe ser string con formato ObjectId válido

### Validaciones de Negocio

1. **Existencia de Recursos**:
   - Workspace debe existir
   - Préstamo debe existir
   - Préstamo debe pertenecer al workspace especificado

2. **Estado del Préstamo**:
   - No se pueden realizar pagos a préstamos ya liquidados
   - El monto del pago no puede exceder el saldo pendiente total

3. **Pago Específico**:
   - La cuota debe existir
   - No se puede pagar una cuota ya liquidada
   - El monto no puede exceder el saldo pendiente de la cuota específica

## Historial de Pagos

Cada pago se registra en el array `history` del préstamo con la siguiente información:

| Campo | Tipo | Descripción |
|------|------|-------------|
| `payment_date` | Date | Fecha del pago |
| `payment` | number | Monto pagado |
| `remaining_balance` | number | Saldo restante después del pago |
| `paid_installments` | number | Total de cuotas liquidadas |
| `loan_status` | string | Estado del préstamo después del pago |
| `paid_installment_ids` | Array | IDs de cuotas liquidadas en esta transacción |
| `installment_details` | Array | Detalle de cada cuota afectada |

### Detalle de Cuotas (`installment_details`)

```json
{
  "installment_id": "69c567cda9a74908ae68e3d8",
  "amount_paid": 50000,
  "previous_status": "pending",
  "new_status": "liquidated"
}
```

## Actualización de Estadísticas

El endpoint actualiza automáticamente las estadísticas del workspace:

- `stats.active_loans`: Se decrementa si el préstamo se liquida
- `stats.liquidate_loans`: Se incrementa si el préstamo se liquida  
- `stats.total_incomes`: Se incrementa por el monto total pagado
- `stats.total_pending`: Se decrementa por el monto total pagado

## Estados de Cuotas

| Estado | Descripción |
|--------|-------------|
| `pending` | Cuota pendiente de pago |
| `partial` | Cuota con pago parcial (payment > 0 pero < amount) |
| `liquidated` | Cuota completamente pagada (payment = amount) |
| `late` | Cuota vencida (actualizado automáticamente por `checkAndUpdateLateStatus`) |

## Casos de Uso Típicos

### 1. Pago Regular de Cuota
```json
{
  "loanId": "...",
  "workspaceId": "...",
  "paymentAmount": 10000
}
```
*Resultado: Paga la siguiente cuota pendiente en orden*

### 2. Completar Cuota Parcial
```json
{
  "loanId": "...",
  "workspaceId": "...",
  "paymentAmount": 5000,
  "installmentId": "..."
}
```
*Resultado: Completa una cuota que tenía un pago parcial previo*

### 3. Pago Parcial de Cuota Específica
```json
{
  "loanId": "...",
  "workspaceId": "...",
  "paymentAmount": 3000,
  "installmentId": "..."
}
```
*Resultado: Deja la cuota específica en estado parcial*

### 4. Liquidación de Préstamo
```json
{
  "loanId": "...",
  "workspaceId": "...",
  "paymentAmount": 150000
}
```
*Resultado: Liquida todas las cuotas pendientes y cambia el estado del préstamo a "liquidated"*

## Manejo de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Workspace not found` | WorkspaceId no existe | Verificar el ID del workspace |
| `Loan not found` | LoanId no existe | Verificar el ID del préstamo |
| `The loan does not belong to the specified workspace` | El préstamo no pertenece al workspace | Verificar la relación préstamo-workspace |
| `the loan has already been paid` | Préstamo ya liquidado | No se pueden realizar más pagos |
| `Payment amount cannot exceed the remaining balance` | Monto excede saldo pendiente | Reducir el monto del pago |
| `Installment with ID ... not found` | Cuota específica no existe | Verificar el ID de la cuota |
| `Installment with ID ... is already liquidated` | Cuota ya pagada | Elegir otra cuota o omitir installmentId |

## Consideraciones Técnicas

- El endpoint utiliza `checkAndUpdateLateStatus` para actualizar estados de cuotas atrasadas antes del procesamiento
- Los cambios en las cuotas se guardan usando `updatedLoan.save()` para persistir las modificaciones
- El procesamiento es atómico: o se procesa el pago completo o no se aplica ningún cambio
- Todas las fechas se registran en UTC usando `new Date()`

## Ejemplo Completo de Flujo

```javascript
// 1. Obtener préstamo para verificar cuotas pendientes
GET /loans/detail/workspaceId/loanId

// 2. Realizar pago estándar (siguiente cuota)
POST /installments/pay
{
  "loanId": "69f2cbb9eab7586f57e9017b",
  "workspaceId": "69bc5079433eaa665ad95e32", 
  "paymentAmount": 25000
}

// 3. Verificar resultado
GET /loans/detail/workspaceId/loanId
```
