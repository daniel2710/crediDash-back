# API Documentation: Update Loan

## Endpoint

```
PATCH /loans/:workspaceId/:loanId
```

## Descripción

Actualiza la información de un préstamo existente. Según el estado de las cuotas, permite diferentes niveles de modificación.

## Autenticación

Requiere token de autenticación válido (Bearer Token).

## Parámetros de URL

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `workspaceId` | string (ObjectId) | ID del workspace al que pertenece el préstamo |
| `loanId` | string (ObjectId) | ID del préstamo a actualizar |

## Body de la Petición

### Cuando NO hay cuotas pagadas

Puedes modificar cualquier campo:

```json
{
  "description": "Nueva descripción del préstamo",
  "payment_frequency": "weekly",
  "amount": 5000,
  "interest": 10
}
```

### Cuando hay cuotas pagadas (liquidated o partial)

Solo puedes modificar:

```json
{
  "description": "Nueva descripción del préstamo",
  "payment_frequency": "monthly"
}
```

## Campos permitidos

| Campo | Tipo | Requerido | Descripción | Restricciones |
|-------|------|-----------|-------------|---------------|
| `description` | string | No | Descripción del préstamo | - |
| `payment_frequency` | string | No | Frecuencia de pago | Valores: `diary`, `weekly`, `fortnightly`, `monthly` |
| `amount` | number | No | Monto del préstamo | Solo si no hay cuotas pagadas. Debe ser ≥ 0 |
| `interest` | number | No | Interés del préstamo (%) | Solo si no hay cuotas pagadas. Debe ser ≥ 0 |

## Comportamiento del recálculo

Cuando modificas `amount` o `interest` (y no hay cuotas pagadas):

1. Se calcula el nuevo total: `nuevo_total = amount + (amount * interest / 100)`
2. Se recalcula `payment_missing` basado en el nuevo total
3. Se recalculan todas las cuotas pendientes con el nuevo monto por cuota
4. Se actualizan las estadísticas del workspace (`total_lents` y `total_pending`)

## Respuestas

### Éxito (200)

```json
{
  "status": "success",
  "message": "Loan updated successfully",
  "loan": {
    "_id": "...",
    "amount": 5000,
    "interest": 10,
    "description": "Nueva descripción",
    "payment_frequency": "weekly",
    "payment_missing": 5500,
    "installments": [...]
  }
}
```

### Error - Cuotas pagadas (400)

```json
{
  "status": "failed",
  "message": "Cannot modify amount or interest when installments have been paid. Only description can be updated."
}
```

### Error - Préstamo no encontrado (404)

```json
{
  "status": "failed",
  "message": "Loan not found"
}
```

### Error - Workspace no pertenece al préstamo (403)

```json
{
  "status": "failed",
  "message": "The loan does not belong to the specified workspace"
}
```

## Ejemplo de uso (Frontend)

### React/JavaScript

```javascript
// Actualizar solo descripción (siempre permitido)
const updateDescription = async (workspaceId, loanId, description) => {
  const response = await fetch(`/loans/${workspaceId}/${loanId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ description })
  });
  return response.json();
};

// Actualizar monto e interés (solo si no hay cuotas pagadas)
const updateLoanAmount = async (workspaceId, loanId, amount, interest) => {
  const response = await fetch(`/loans/${workspaceId}/${loanId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount, interest })
  });
  
  const data = await response.json();
  
  if (data.status === 'failed') {
    // Manejar error - probablemente hay cuotas pagadas
    console.error(data.message);
  }
  
  return data;
};
```

## Notas importantes

- **Verificar cuotas antes de editar**: Antes de mostrar opciones de edición de monto/interés en el frontend, verifica si hay cuotas pagadas consultando el préstamo.
- **Recálculo automático**: Cuando cambias monto o interés, todas las cuotas pendientes se recalculan automáticamente.
- **Estadísticas**: El workspace se actualiza automáticamente para reflejar los nuevos montos.
