# CrediDash - Documentación de Lógica de Negocio

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Modelos de Datos](#modelos-de-datos)
4. [Lógica de Negocio](#lógica-de-negocio)
5. [Flujos de Trabajo](#flujos-de-trabajo)
6. [Controladores y Funcionalidades](#controladores-y-funcionalidades)

---

## Descripción General

**CrediDash** es una aplicación SaaS (Software as a Service) diseñada para la gestión de préstamos, clientes y espacios de trabajo (workspaces). El sistema permite a prestamistas y entidades financieras administrar su cartera de préstamos, realizar seguimiento de pagos, gestionar clientes y obtener estadísticas en tiempo real sobre su negocio.

### Propósito del Negocio
- **Gestión de Préstamos**: Crear, actualizar y liquidar préstamos con diferentes métodos de pago (diario, semanal, quincenal, mensual)
- **Control de Cuotas**: Administrar cuotas individuales con estados (pendiente, parcial, liquidado, atrasado)
- **Gestión de Clientes**: Mantener una base de datos de clientes con información de contacto
- **Análisis Financiero**: Proporcionar estadísticas sobre préstamos activos, liquidados, ingresos, egresos y cartera total
- **Multi-tenancy**: Soportar múltiples usuarios con espacios de trabajo independientes

---

## Arquitectura Técnica

### Stack Tecnológico
- **Runtime**: Node.js
- **Framework**: Express.js 4.21.2
- **Lenguaje**: TypeScript 5.7.3
- **Base de Datos**: MongoDB (Mongoose 8.9.5)
- **Autenticación**: Cookie-based con tokens de sesión
- **Seguridad**: HMAC SHA-256 para hash de contraseñas

### Estructura del Proyecto
```
src/
├── controllers/        # Lógica de negocio y controladores
│   ├── auth/          # Autenticación
│   ├── clients/       # Gestión de clientes
│   ├── installments/  # Gestión de cuotas
│   ├── loans/         # Gestión de préstamos
│   └── users/         # Gestión de usuarios
├── db/                # Configuración de base de datos
├── helpers/           # Funciones auxiliares
├── middlewares/       # Middlewares de Express
├── routes/            # Definición de rutas
└── schemas/           # Modelos de Mongoose
```

---

## Modelos de Datos

### 1. User (Usuario)

**Propósito de Negocio**: Representa a los usuarios del sistema que pueden ser administradores o revisores de préstamos.

**Información Técnica**:
```typescript
{
  workspaceId: ObjectId,        // Referencia al workspace
  company_name: String,         // Nombre de la empresa
  name: String,                 // Nombre del usuario
  lastname: String,             // Apellido del usuario
  email: String (unique),       // Correo electrónico (único)
  type: 'admin' | 'reviewer',   // Tipo de usuario
  authentication: {
    salt: String,               // Salt para hash de contraseña
    sessionToken: String,       // Token de sesión activa
    password: String            // Contraseña hasheada
  },
  createdAt: Date               // Fecha de creación
}
```

**Características**:
- Email único en todo el sistema
- Contraseñas hasheadas con HMAC SHA-256
- Dos tipos de usuarios: `admin` (administrador completo) y `reviewer` (revisor)
- Cada usuario tiene un workspace asociado

---

### 2. Workspace (Espacio de Trabajo)

**Propósito de Negocio**: Representa el espacio de trabajo de un usuario, conteniendo toda su información financiera, configuraciones y estadísticas del negocio.

**Información Técnica**:
```typescript
{
  userId: ObjectId,                    // Referencia al usuario propietario
  plan: 'free' | 'premium',            // Plan de suscripción
  interface_config: {
    theme: 'light' | 'dark'            // Tema de la interfaz
  },
  stats: {
    total_loans: Number,               // Total de préstamos creados
    active_loans: Number,              // Préstamos activos (pendientes/parciales)
    liquidate_loans: Number,           // Préstamos completamente liquidados
    total_clients: Number,             // Total de clientes
    total_lents: Number,               // Total de egresos (dinero prestado)
    total_incomes: Number,             // Total de ingresos (pagos recibidos)
    total_pending: Number              // Total de cartera (dinero pendiente)
  },
  createdAt: Date
}
```

**Características**:
- Relación 1:1 con User
- Estadísticas actualizadas en tiempo real
- Soporta planes free y premium
- Configuración personalizable de interfaz

---

### 3. Client (Cliente)

**Propósito de Negocio**: Representa a los clientes que solicitan préstamos. Almacena información de contacto y pertenece a un workspace específico.

**Información Técnica**:
```typescript
{
  workspaceId: ObjectId,        // Referencia al workspace
  name: String,                 // Nombre del cliente
  lastname: String,             // Apellido del cliente
  email: String,                // Correo electrónico (opcional)
  phone: String,                // Teléfono (opcional)
  address: String,              // Dirección (opcional)
  description: String,          // Notas adicionales (opcional)
  createdAt: Date               // Fecha de registro
}
```

**Características**:
- Múltiples clientes por workspace
- Email no es único (puede haber clientes sin email)
- Validación de duplicados exactos
- Información de contacto flexible

---

### 4. Loan (Préstamo)

**Propósito de Negocio**: Representa un préstamo otorgado a un cliente, con su información financiera, cuotas asociadas e historial de pagos.

**Información Técnica**:
```typescript
{
  workspaceId: ObjectId,                              // Referencia al workspace
  clientId: ObjectId,                                 // Referencia al cliente
  status: 'pending' | 'liquidated' | 'partial' | 'late',  // Estado del préstamo
  description: String,                                // Descripción del préstamo
  amount: Number,                                     // Monto principal prestado
  interest: Number,                                   // Porcentaje de interés
  installments_qty: Number,                           // Cantidad de cuotas
  installments_info: {
    paid_installments: Number                         // Cuotas completamente pagadas
  },
  installments: [Installment],                        // Array de cuotas
  history: [History],                                 // Historial de pagos
  payment_actual: Number,                             // Total pagado hasta ahora
  payment_missing: Number,                            // Saldo pendiente
  payment_method: 'diary' | 'weekly' | 'fortnightly' | 'monthly',  // Frecuencia de pago
  start_date: Date,                                   // Fecha de inicio del préstamo (default: fecha actual)
  createdAt: Date
}
```

**Sub-esquema: Installment (Cuota)**:
```typescript
{
  status: 'pending' | 'liquidated' | 'partial' | 'late',  // Estado de la cuota
  payment: Number,                                // Monto pagado de esta cuota
  amount: Number,                                 // Monto total de la cuota
  payment_date: Date,                             // Fecha del último pago
  end_date: Date                                  // Fecha de vencimiento
}
```

**Sub-esquema: History (Historial)**:
```typescript
{
  payment_date: Date,           // Fecha del abono
  payment: Number,              // Monto del abono
  remaining_balance: Number,    // Saldo restante tras el abono
  paid_installments: Number,    // Cuotas liquidadas hasta este momento
  loan_status: String           // Estado del préstamo después del pago
}
```

**Características**:
- Cálculo automático de intereses: `totalAmount = amount + (amount * interest / 100)`
- Generación automática de cuotas según método de pago
- **Fecha de inicio personalizable**: Permite especificar cuándo comienza el préstamo
  - Si se proporciona `start_date`, las cuotas se calculan desde esa fecha
  - Si no se proporciona, se usa la fecha actual por defecto
- Cuatro estados posibles:
  - `pending`: Sin pagos realizados y dentro del plazo
  - `partial`: Pagos parciales realizados
  - `late`: Una o más cuotas han pasado su fecha de vencimiento sin ser pagadas
  - `liquidated`: Completamente pagado
- Verificación automática de estado atrasado basado en fechas de vencimiento
- Historial completo de transacciones

---

## Lógica de Negocio

### 1. Creación de Cuenta (Sign Up)

**Flujo**:
1. Usuario proporciona: nombre, apellido, email, contraseña, tipo
2. Sistema valida campos obligatorios
3. Verifica que el email no esté registrado
4. Genera salt aleatorio y hashea la contraseña
5. Crea el usuario en la base de datos
6. Crea automáticamente un workspace asociado con:
   - Plan: `free`
   - Tema: `light`
   - Estadísticas inicializadas en 0
7. Vincula el workspace al usuario

**Rollback**: Si falla la creación del workspace, se elimina el usuario creado.

---

### 2. Autenticación (Sign In)

**Flujo**:
1. Usuario proporciona email y contraseña
2. Sistema normaliza el email a minúsculas
3. Busca el usuario por email
4. Verifica la contraseña usando HMAC SHA-256
5. Genera un token de sesión único
6. Guarda el token en la base de datos
7. Establece cookie `CREDIDASH-AUTH` con el token

**Seguridad**:
- Contraseñas hasheadas con salt único por usuario
- Tokens de sesión generados con 128 bytes aleatorios
- Cookies con `sameSite: 'none'` y `secure: true`

---

### 3. Gestión de Clientes

#### Crear Cliente
**Lógica**:
1. Valida workspaceId y userId
2. Verifica que el workspace pertenezca al usuario
3. Previene duplicados exactos (mismo nombre, apellido, email, teléfono, dirección)
4. Crea el cliente
5. Incrementa `stats.total_clients` en el workspace

#### Eliminar Cliente
**Lógica**:
1. Valida que el cliente exista
2. Verifica que el workspace del cliente pertenezca al usuario
3. Elimina el cliente
4. **Nota**: No decrementa estadísticas (mantiene histórico)

#### Consultar Clientes
**Características**:
- Paginación con límite configurable (default: 15)
- Filtrado por workspace
- Retorna información de paginación completa

---

### 4. Gestión de Préstamos

#### Crear Préstamo

**Cálculos Financieros**:
```javascript
totalAmount = amount + (amount * interest / 100)
amountPerQuota = totalAmount / installments_qty
```

**Fecha de Inicio del Préstamo**:
- **Parámetro opcional**: `start_date`
- Si se proporciona: Las cuotas se calculan desde la fecha especificada
- Si no se proporciona: Se usa la fecha actual por defecto
- Permite programar préstamos para comenzar en una fecha futura

**Generación de Cuotas**:

Las cuotas se generan a partir de `start_date` (o fecha actual si no se especifica):

- **Diario**: Cuotas cada 1 día (comienza al día siguiente de start_date)
- **Semanal**: Cuotas cada 7 días
- **Quincenal**: Cuotas cada 15 días
- **Mensual**: Cuotas cada 30 días

**Actualización de Estadísticas**:
```javascript
stats.total_loans += 1
stats.active_loans += 1
stats.total_lents += amount          // Dinero prestado
stats.total_pending += totalAmount   // Cartera total
```

**Ejemplo 1 - Sin start_date (comportamiento por defecto)**:
- Préstamo: $1,000,000
- Interés: 10%
- Cuotas: 10
- Método: Semanal
- start_date: No especificado

Resultado:
- Total a pagar: $1,100,000
- Por cuota: $110,000
- Fechas: Cada 7 días desde mañana (fecha actual + 1 día)

**Ejemplo 2 - Con start_date personalizado**:
- Préstamo: $1,000,000
- Interés: 10%
- Cuotas: 10
- Método: Semanal
- start_date: "2026-04-01"

Resultado:
- Total a pagar: $1,100,000
- Por cuota: $110,000
- Fechas: Cada 7 días desde 2026-04-02 (start_date + 1 día)
  - Cuota 1: 2026-04-02
  - Cuota 2: 2026-04-09
  - Cuota 3: 2026-04-16
  - ... y así sucesivamente

---

#### Pagar Cuota (payInstallment)

**Lógica de Distribución de Pagos**:

El sistema distribuye el pago de manera inteligente entre las cuotas pendientes:

1. **Recorre las cuotas en orden**
2. **Para cada cuota pendiente o parcial**:
   - Calcula cuánto falta por pagar: `paymentMissing = amount - payment`
   - **Si el pago cubre la cuota completa**:
     - Marca la cuota como `liquidated`
     - Resta el monto de la cuota del pago restante
     - Continúa con la siguiente cuota
   - **Si el pago es menor que lo que falta**:
     - Marca la cuota como `partial`
     - Suma el pago parcial a la cuota
     - Termina el proceso (no hay más dinero)

**Ejemplo Práctico**:
```
Pago recibido: $250,000

Cuota 1: $110,000 (pendiente)
  → Pago: $110,000 → Estado: liquidated
  → Restante: $140,000

Cuota 2: $110,000 (pendiente)
  → Pago: $110,000 → Estado: liquidated
  → Restante: $30,000

Cuota 3: $110,000 (pendiente)
  → Pago: $30,000 → Estado: partial
  → Restante: $0
```

**Actualización del Préstamo**:
```javascript
payment_actual += paymentAmount
payment_missing -= paymentAmount
installments_info.paid_installments = cuotas con status 'liquidated'

// Estado del préstamo
if (payment_missing <= 0) {
  status = 'liquidated'
} else if (payment_actual > 0) {
  status = 'partial'
}
```

**Historial de Pagos**:
Cada pago se registra en el array `history` con información detallada:
```javascript
{
  payment_date: new Date(),
  payment: paymentAmount,
  remaining_balance: payment_missing,
  paid_installments: loan.installments_info.paid_installments,
  loan_status: loan.status
}
```

**Ejemplo de Historial**:
```json
[
  {
    "payment_date": "2026-03-15T10:30:00Z",
    "payment": 250000,
    "remaining_balance": 850000,
    "paid_installments": 2,
    "loan_status": "partial"
  },
  {
    "payment_date": "2026-03-22T14:15:00Z",
    "payment": 110000,
    "remaining_balance": 740000,
    "paid_installments": 3,
    "loan_status": "partial"
  },
  {
    "payment_date": "2026-04-10T09:00:00Z",
    "payment": 740000,
    "remaining_balance": 0,
    "paid_installments": 10,
    "loan_status": "liquidated"
  }
]
```

**Información que proporciona el historial**:
- **Fecha exacta** de cada pago
- **Monto** de cada abono
- **Saldo restante** después de cada pago
- **Progreso de cuotas**: Cuántas cuotas se han liquidado completamente
- **Cambios de estado**: Cómo evolucionó el préstamo (pending → partial → liquidated)

**Actualización de Estadísticas del Workspace**:
```javascript
stats.total_incomes += paymentAmount
stats.total_pending -= paymentAmount

// Si el préstamo se liquidó completamente
if (loan.status === 'liquidated') {
  stats.active_loans -= 1
  stats.liquidate_loans += 1
}
```

---

#### Liquidar Préstamo Completo (payLoanAsLiquidated)

**Propósito**: Marcar un préstamo como completamente pagado sin procesar pagos individuales.

**Lógica**:
1. Verifica que el préstamo no esté ya liquidado
2. Marca todas las cuotas como `liquidated`
3. Actualiza el préstamo:
   ```javascript
   status = 'liquidated'
   payment_actual = amount
   payment_missing = 0
   installments_info.paid_installments = installments.length
   ```
4. Registra en el historial el pago del saldo restante
5. **Nota**: No actualiza estadísticas del workspace (solo cambia estado)

---

### 5. Sistema de Detección de Préstamos y Cuotas Atrasadas

**Propósito**: Identificar automáticamente préstamos y cuotas que han pasado su fecha de vencimiento sin ser pagadas completamente.

**Lógica de Detección**:

El sistema verifica el estado de las cuotas comparando la fecha de vencimiento (`end_date`) con la fecha actual:

```javascript
// Para cada cuota
if (installment.status !== 'liquidated' && installment.end_date < now) {
  installment.status = 'late'
}
```

**Reglas de Estado Atrasado**:

1. **Cuota Atrasada**: Una cuota se marca como `late` cuando:
   - Su estado NO es `liquidated`
   - Su fecha de vencimiento (`end_date`) ya pasó
   - Esto aplica tanto para cuotas `pending` como `partial`

2. **Préstamo Atrasado**: Un préstamo se marca como `late` cuando:
   - Tiene al menos una cuota con estado `late`
   - El préstamo no está completamente liquidado

**Verificación Automática**:

El sistema verifica automáticamente el estado atrasado en los siguientes momentos:

1. **Al consultar préstamos**: Antes de retornar la lista de préstamos de un workspace
   ```javascript
   await checkAndUpdateAllLateLoans(workspaceId);
   ```

2. **Al procesar pagos**: Antes de aplicar un pago a las cuotas
   ```javascript
   await checkAndUpdateLateStatus(loanId);
   ```

**Funciones Helper**:

- `checkAndUpdateLateStatus(loanId)`: Verifica y actualiza el estado de un préstamo específico
- `checkAndUpdateAllLateLoans(workspaceId)`: Verifica y actualiza todos los préstamos no liquidados de un workspace

**Ejemplo de Transición de Estados**:

```
Día 1: Préstamo creado
  → Cuota 1: pending (vence en 7 días)
  → Préstamo: pending

Día 8: Cuota 1 vence sin pago
  → Cuota 1: late (pasó su fecha de vencimiento)
  → Préstamo: late (tiene cuotas atrasadas)

Día 10: Cliente paga la cuota 1
  → Cuota 1: liquidated
  → Préstamo: partial (si quedan cuotas pendientes)
  → Si la cuota 2 también está vencida: Préstamo: late
```

**Beneficios**:
- Identificación inmediata de clientes morosos
- Seguimiento preciso de la cartera vencida
- Alertas automáticas sobre pagos atrasados
- Mejor gestión de riesgo crediticio

---

### 6. Estadísticas en Tiempo Real

El workspace mantiene estadísticas actualizadas automáticamente:

| Estadística | Cuándo se Actualiza | Operación |
|-------------|---------------------|-----------|
| `total_loans` | Al crear préstamo | +1 |
| `active_loans` | Al crear préstamo | +1 |
| `active_loans` | Al liquidar préstamo | -1 |
| `liquidate_loans` | Al liquidar préstamo | +1 |
| `total_clients` | Al crear cliente | +1 |
| `total_lents` | Al crear préstamo | +amount |
| `total_incomes` | Al pagar cuota | +paymentAmount |
| `total_pending` | Al crear préstamo | +totalAmount |
| `total_pending` | Al pagar cuota | -paymentAmount |

**Fórmulas Clave**:
```
Cartera Activa = total_pending
Ganancia Bruta = total_incomes - total_lents
ROI = (total_incomes / total_lents) * 100
```

---

## Flujos de Trabajo

### Flujo Completo: Desde Registro hasta Liquidación

```
1. REGISTRO
   Usuario crea cuenta
   ↓
   Sistema crea User + Workspace
   ↓
   stats = {todos en 0}

2. AGREGAR CLIENTE
   Usuario crea cliente
   ↓
   stats.total_clients += 1

3. CREAR PRÉSTAMO
   Usuario crea préstamo de $1,000,000 al 10% en 10 cuotas semanales
   ↓
   Sistema calcula:
   - Total: $1,100,000
   - Por cuota: $110,000
   - Genera 10 cuotas con fechas
   ↓
   stats.total_loans += 1
   stats.active_loans += 1
   stats.total_lents += 1,000,000
   stats.total_pending += 1,100,000

4. PAGAR CUOTAS
   Cliente paga $250,000
   ↓
   Sistema distribuye:
   - Cuota 1: $110,000 (liquidated)
   - Cuota 2: $110,000 (liquidated)
   - Cuota 3: $30,000 (partial)
   ↓
   loan.payment_actual = 250,000
   loan.payment_missing = 850,000
   loan.status = 'partial'
   ↓
   stats.total_incomes += 250,000
   stats.total_pending -= 250,000

5. LIQUIDAR PRÉSTAMO
   Cliente paga los $850,000 restantes
   ↓
   Todas las cuotas → liquidated
   loan.status = 'liquidated'
   ↓
   stats.active_loans -= 1
   stats.liquidate_loans += 1
   stats.total_incomes += 850,000
   stats.total_pending -= 850,000

RESULTADO FINAL:
- total_loans: 1
- active_loans: 0
- liquidate_loans: 1
- total_clients: 1
- total_lents: 1,000,000
- total_incomes: 1,100,000
- total_pending: 0
- Ganancia: $100,000 (10% de interés)
```

---

## Controladores y Funcionalidades

### Autenticación (`/auth`)

#### POST `/auth/signin`
- **Función**: Iniciar sesión
- **Input**: `{ email, password }`
- **Output**: Usuario + cookie de sesión
- **Validaciones**: Email existe, contraseña correcta

---

### Usuarios (`/users`)

#### POST `/users/create`
- **Función**: Crear cuenta nueva
- **Input**: `{ name, lastname, email, password, type }`
- **Output**: Usuario + Workspace creados
- **Validaciones**: Email único, tipo válido (admin/reviewer)
- **Transacción**: Rollback si falla creación de workspace

#### GET `/users`
- **Función**: Obtener todos los usuarios
- **Output**: Lista de usuarios

#### GET `/users/:userId`
- **Función**: Obtener usuario por ID
- **Output**: Datos del usuario

#### GET `/users/workspace/:workspaceId`
- **Función**: Obtener usuarios de un workspace
- **Output**: Lista de usuarios del workspace

#### PUT `/users/:userId`
- **Función**: Actualizar usuario
- **Input**: Campos a actualizar
- **Output**: Usuario actualizado

---

### Clientes (`/clients`)

#### POST `/clients/create`
- **Función**: Crear cliente
- **Input**: `{ workspaceId, userId, name, lastname, email?, phone?, address?, description? }`
- **Output**: Cliente creado
- **Validaciones**: Workspace existe, pertenece al usuario, no duplicado exacto
- **Efecto**: `stats.total_clients += 1`

#### GET `/clients/workspace/:workspaceId`
- **Función**: Obtener clientes por workspace
- **Query Params**: `page`, `limit`
- **Output**: Clientes paginados

#### GET `/clients/:clientId`
- **Función**: Obtener cliente por ID
- **Output**: Datos del cliente

#### PUT `/clients/:clientId`
- **Función**: Actualizar cliente
- **Input**: Campos a actualizar
- **Output**: Cliente actualizado

#### DELETE `/clients/:clientId/:userId`
- **Función**: Eliminar cliente
- **Validaciones**: Cliente existe, workspace pertenece al usuario
- **Output**: Confirmación de eliminación

---

### Préstamos (`/loans`)

#### POST `/loans/create`
- **Función**: Crear préstamo
- **Input**: `{ workspaceId, clientId, status, description, amount, interest, installments_qty, payment_method, start_date? }`
- **Output**: Préstamo con cuotas generadas
- **Validaciones**: Workspace y cliente existen, cliente pertenece al workspace
- **Parámetros opcionales**:
  - `start_date`: Fecha de inicio del préstamo (si no se proporciona, usa fecha actual)
- **Cálculos**: Total con interés, cuotas, fechas de vencimiento calculadas desde start_date
- **Efectos**: 
  - `stats.total_loans += 1`
  - `stats.active_loans += 1`
  - `stats.total_lents += amount`
  - `stats.total_pending += totalAmount`

#### GET `/loans/workspace/:workspaceId/:userId`
- **Función**: Obtener préstamos por workspace
- **Query Params**: `page`, `limit`
- **Output**: Préstamos paginados con cuotas

#### GET `/loans/client/:clientId`
- **Función**: Obtener préstamos de un cliente
- **Output**: Lista de préstamos del cliente

#### PUT `/loans/:loanId`
- **Función**: Actualizar préstamo
- **Input**: Campos a actualizar
- **Output**: Préstamo actualizado

---

### Cuotas (`/installments`)

#### POST `/installments/pay`
- **Función**: Procesar pago de cuotas
- **Input**: `{ loanId, workspaceId, paymentAmount }`
- **Output**: Préstamo actualizado con cuotas pagadas
- **Lógica**: Distribución inteligente del pago entre cuotas pendientes
- **Efectos**:
  - Actualiza `payment_actual`, `payment_missing`, `status`
  - Registra en `history`
  - `stats.total_incomes += paymentAmount`
  - `stats.total_pending -= paymentAmount`
  - Si liquidado: `stats.active_loans -= 1`, `stats.liquidate_loans += 1`

#### POST `/loans/liquidate`
- **Función**: Marcar préstamo como liquidado
- **Input**: `{ loanId, workspaceId }`
- **Output**: Préstamo marcado como liquidado
- **Lógica**: Marca todas las cuotas como liquidadas sin procesar pago
- **Efectos**: Actualiza estado del préstamo y cuotas

---

## Consideraciones Técnicas

### Validaciones
- **ObjectId**: Todos los IDs se validan con `mongoose.Types.ObjectId.isValid()`
- **Campos numéricos**: Verificación de tipo, NaN y valores negativos
- **Enums**: Validación estricta de valores permitidos
- **Duplicados**: Prevención de clientes duplicados exactos

### Paginación
- Sistema de paginación reutilizable
- Default: 15 items por página
- Retorna: resultados, página actual, total de páginas, siguiente/anterior, total de items

### Seguridad
- Contraseñas nunca se retornan en queries (select: false)
- Hash HMAC SHA-256 con salt único
- Tokens de sesión de 128 bytes
- Validación de pertenencia (workspace-user, client-workspace, loan-workspace)

### Manejo de Errores
- Validación exhaustiva de inputs
- Mensajes de error descriptivos
- Códigos HTTP apropiados (400, 403, 404, 500)
- Rollback en operaciones transaccionales

### Performance
- Índices en campos únicos (email)
- Referencias con ObjectId para joins eficientes
- Paginación para grandes volúmenes de datos
- Populate selectivo en queries

---

## Glosario de Términos

- **Workspace**: Espacio de trabajo aislado para cada usuario
- **Loan**: Préstamo otorgado a un cliente
- **Installment**: Cuota individual de un préstamo
- **Payment Method**: Frecuencia de pago (diario, semanal, quincenal, mensual)
- **Status**: Estado de préstamo o cuota (pending, partial, late, liquidated)
- **Total Lents**: Total de dinero prestado (egresos)
- **Total Incomes**: Total de dinero recibido en pagos (ingresos)
- **Total Pending**: Cartera total pendiente de cobro
- **History**: Registro cronológico de todos los pagos realizados

---

## Conclusión

CrediDash es un sistema robusto de gestión de préstamos que automatiza cálculos financieros, mantiene estadísticas en tiempo real y proporciona un control granular sobre préstamos y cuotas. Su arquitectura multi-tenant permite que múltiples usuarios operen de forma independiente, mientras que su sistema de estadísticas proporciona visibilidad completa del estado financiero del negocio.
