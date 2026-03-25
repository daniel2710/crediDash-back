# Documentación del Endpoint de Inicio de Sesión (Sign In)

## Información General

El endpoint de inicio de sesión permite a los usuarios autenticarse en el sistema CrediDash mediante su email y contraseña, generando un token de sesión que se almacena en una cookie HTTP.

---

## Endpoint

**URL:** `POST /api/signin`

**Autenticación requerida:** No

---

## Flujo de Autenticación

### 1. Request (Solicitud)

#### Headers
```
Content-Type: application/json
```

#### Body (JSON)
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_del_usuario"
}
```

#### Campos requeridos
- **email** (string): Email del usuario (se normaliza a minúsculas)
- **password** (string): Contraseña del usuario

---

### 2. Proceso de Validación

El servidor ejecuta los siguientes pasos:

1. **Validación de campos**: Verifica que email y password estén presentes
2. **Normalización**: Convierte el email a minúsculas
3. **Búsqueda de usuario**: Busca el usuario en la base de datos por email
4. **Verificación de credenciales**: 
   - Obtiene el `salt` y `password` hasheado del usuario
   - Genera un hash con la contraseña proporcionada usando HMAC-SHA256
   - Compara el hash generado con el almacenado

---

### 3. Generación del Token de Sesión

Si las credenciales son correctas:

1. **Genera un salt aleatorio**: 
   - Utiliza `crypto.randomBytes(128)` convertido a base64
   - Genera 128 bytes aleatorios (~171 caracteres en base64)
   - Duración: 1 hora

2. **Crea el sessionToken**:
   ```javascript
   sessionToken = HMAC-SHA256(salt + '/' + userId, SECRET_KEY)
   ```
   - Combina el salt y el userId del usuario
   - Aplica HMAC-SHA256 usando la SECRET_KEY del entorno
   - Resultado: String hexadecimal de 64 caracteres

3. **Almacena el token**:
   - Guarda el `sessionToken` en el documento del usuario en MongoDB
   - Campo: `authentication.sessionToken`

---

### 4. Envío del Token al Cliente

El token se envía mediante una **cookie HTTP**:

```javascript
res.cookie('CREDIDASH-AUTH', sessionToken, {
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 60 * 1000, // 1 hora
});
```

#### Configuración de la Cookie

| Propiedad | Valor | Descripción |
|-----------|-------|-------------|
| **Nombre** | `CREDIDASH-AUTH` | Nombre de la cookie |
| **Valor** | `sessionToken` | Token de sesión generado (64 caracteres hex) |
| **sameSite** | `none` | Permite envío cross-site (necesario para CORS) |
| **secure** | `true` | Solo se envía por HTTPS |
| **httpOnly** | No establecido | La cookie es accesible desde JavaScript |
| **maxAge** | 60 * 60 * 1000 | 1 hora |
| **expires** | No establecido | Sin fecha de expiración explícita |

---

## Duración del Token de Sesión

### ⚠️ IMPORTANTE: El token NO tiene expiración automática

- **Tipo**: Cookie de sesión del navegador
- **Duración**: Permanece válido hasta que:
  1. El usuario cierra el navegador (si el navegador respeta cookies de sesión)
  2. El usuario cierra sesión manualmente (si existe endpoint de logout)
  3. Se regenera un nuevo token al iniciar sesión nuevamente
  4. Se elimina manualmente del documento del usuario en la base de datos

### Implicaciones de Seguridad

⚠️ **Sin expiración automática**, el token permanece válido indefinidamente mientras:
- Exista en la base de datos
- El navegador lo conserve

**Recomendaciones**:
- Implementar expiración de tokens (ej: 24 horas, 7 días)
- Implementar endpoint de logout que elimine el token
- Considerar refresh tokens para sesiones largas
- Implementar limpieza periódica de tokens antiguos

---

## Response (Respuesta)

### Éxito (200 OK)
```json
{
  "status": "success",
  "user": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "workspaceId": "65f1a2b3c4d5e6f7g8h9i0j2",
    "company_name": "Mi Empresa",
    "name": "Juan",
    "lastname": "Pérez",
    "email": "juan@ejemplo.com",
    "type": "admin",
    "createdAt": "2024-03-15T10:30:00.000Z"
  }
}
```

**Nota**: Los campos `authentication.salt`, `authentication.password` y `authentication.sessionToken` NO se incluyen en la respuesta (están marcados como `select: false` en el schema).

### Errores

#### 400 - Campo faltante
```json
{
  "status": "failed",
  "message": "email is required"
}
```
o
```json
{
  "status": "failed",
  "message": "password is required"
}
```

#### 400 - Usuario no existe
```json
{
  "status": "failed",
  "message": "User does not exist"
}
```

#### 400 - Credenciales incorrectas
```json
{
  "status": "failed",
  "message": "Incorrect email or password"
}
```

#### 500 - Error del servidor
```json
{
  "status": "failed",
  "message": "An unexpected error occurred"
}
```

---

## Middleware de Autenticación

### Cómo se valida el token en requests posteriores

Archivo: `src/middlewares/isAuthenticated.ts`

```javascript
const sessionToken = req.cookies['CREDIDASH-AUTH']
```

1. **Extrae la cookie**: Lee `CREDIDASH-AUTH` de las cookies del request
2. **Valida existencia**: Si no existe, retorna `403 Forbidden`
3. **Busca usuario**: Busca en MongoDB un usuario con ese `sessionToken`
4. **Verifica usuario**: Si no existe, retorna `403 Forbidden`
5. **Inyecta identidad**: Agrega el usuario a `req.identity` usando lodash merge
6. **Continúa**: Llama a `next()` para continuar con el request

### Uso en rutas protegidas

```javascript
router.get('/loans/:workspaceId/:clientId', isAuthenticated, getAllLoansByClient);
```

Todas las rutas que incluyen `isAuthenticated` requieren la cookie `CREDIDASH-AUTH` válida.

---

## Seguridad

### Encriptación de Contraseñas

Las contraseñas se almacenan usando **HMAC-SHA256**:

```javascript
hashedPassword = HMAC-SHA256(salt + '/' + password, SECRET_KEY)
```

- **Salt único** por usuario (generado al crear cuenta)
- **SECRET_KEY** del entorno (variable `process.env.SECRET_KEY`)
- **Algoritmo**: HMAC con SHA-256
- **Formato**: Hexadecimal (64 caracteres)

### Variables de Entorno Requeridas

```env
SECRET_KEY=tu_clave_secreta_muy_segura
```

⚠️ **Crítico**: La `SECRET_KEY` debe ser:
- Aleatoria y compleja
- Mínimo 32 caracteres
- Nunca compartida o expuesta
- Diferente en cada entorno (dev, staging, prod)

---

## Ejemplo de Uso

### Con cURL

```bash
curl -X POST http://localhost:8080/api/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@credidash.com",
    "password": "miPassword123"
  }' \
  -c cookies.txt
```

### Con JavaScript (Fetch API)

```javascript
const response = await fetch('http://localhost:8080/api/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // IMPORTANTE: Incluir cookies
  body: JSON.stringify({
    email: 'admin@credidash.com',
    password: 'miPassword123'
  })
});

const data = await response.json();
console.log(data);
```

### Request posterior autenticado

```javascript
const response = await fetch('http://localhost:8080/api/loans/workspace/123/456', {
  method: 'GET',
  credentials: 'include', // Envía la cookie CREDIDASH-AUTH automáticamente
});
```

---

## Diagrama de Flujo

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ POST /api/signin
       │ { email, password }
       ▼
┌─────────────────────────────┐
│  Validar campos requeridos  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Buscar usuario por email   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Verificar contraseña      │
│   HMAC-SHA256(salt+pass)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Generar sessionToken       │
│  - Nuevo salt aleatorio     │
│  - HMAC-SHA256(salt+userId) │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Guardar token en MongoDB   │
│  authentication.sessionToken│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Enviar cookie al cliente   │
│  CREDIDASH-AUTH=token       │
│  sameSite=none, secure=true │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Respuesta con datos user   │
│  { status: 'success', user }│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────┐
│   Cliente   │
│ (autenticado)│
└─────────────┘
```

---

## Archivos Relacionados

- **Controlador**: `src/controllers/auth/signIn.ts`
- **Ruta**: `src/routes/authentication.ts`
- **Middleware**: `src/middlewares/isAuthenticated.ts`
- **Schema**: `src/schemas/users.ts`
- **Helpers**: `src/helpers/index.ts`
- **Servidor**: `src/index.ts`

---

## Tipos de Usuario

El sistema soporta 3 tipos de usuarios:

| Tipo | Descripción |
|------|-------------|
| `super` | Super administrador del sistema |
| `admin` | Administrador de workspace |
| `reviewer` | Usuario con permisos de solo lectura |

El tipo se define en el campo `type` del usuario.

---

## Mejoras Recomendadas

1. **Expiración de tokens**: Implementar `maxAge` en la cookie o validación por fecha
2. **Endpoint de logout**: Crear endpoint que elimine el `sessionToken` del usuario
3. **Refresh tokens**: Implementar sistema de refresh para sesiones largas
4. **Rate limiting**: Limitar intentos de login para prevenir ataques de fuerza bruta
5. **2FA**: Implementar autenticación de dos factores
6. **Logs de auditoría**: Registrar intentos de login exitosos y fallidos
7. **HttpOnly cookie**: Establecer `httpOnly: true` para prevenir acceso desde JavaScript
8. **CORS específico**: Configurar dominios permitidos en lugar de `sameSite: 'none'`
