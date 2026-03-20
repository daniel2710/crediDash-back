# Superadmin Setup Guide

## Overview
The superadmin system provides a privileged user type with access to all endpoints in the CrediDash backend.

## Configuration

### Environment Variables
Add the following variables to your `.env` file:

```env
SECRET_KEY=your-secret-key-for-hashing
SUPERADMIN_EMAIL=your-superadmin@example.com
SUPERADMIN_PASSWORD=your-secure-password
```

**Important:** All three variables are **required**. The application will not start if any is missing.
- `SECRET_KEY`: Used for password hashing (required by the authentication system)
- `SUPERADMIN_EMAIL`: Email for the superadmin account
- `SUPERADMIN_PASSWORD`: Password for the superadmin account

## How It Works

### Initialization
On server startup, the system:
1. Checks if `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` are defined
2. If missing, the application exits with an error
3. If defined, checks if a superadmin user exists in the database
4. If exists: logs "Superadmin already exists, creation omitted"
5. If not exists: creates the superadmin user with predefined fields

### User Type
The superadmin has type `'super'` in the user schema. This type:
- Cannot be created manually through the `/create_account` endpoint
- Is only created automatically on initialization
- Has access to all endpoints (bypasses normal access restrictions)

### Access Control

#### Middleware
- **`isAuthenticated`**: Standard authentication check for all users
- **`isSuperAdmin`**: Validates user has type `'super'` - use this for superadmin-only endpoints

#### Usage Example
```typescript
// Superadmin-only endpoint
router.get('/admin/sensitive-data', isAuthenticated, isSuperAdmin, getSensitiveData);

// Regular authenticated endpoint (superadmin can also access)
router.get('/users', isAuthenticated, getAllUsers);
```

### Superadmin Capabilities
The superadmin user:
- ✓ Has access to all authenticated endpoints
- ✓ Can access superadmin-only endpoints (when `isSuperAdmin` middleware is applied)
- ✓ Is created with predefined values:
  - `name`: 'super'
  - `lastname`: 'admin'
  - `company_name`: 'CrediDash System'
  - `type`: 'super'
  - No workspace (workspaceId is undefined)

## Security Notes

1. **Never commit** your `.env` file with real credentials
2. Use a **strong password** for the superadmin account
3. The superadmin type **cannot be created** via the API
4. Only one superadmin is created per email address
5. Superadmin credentials are hashed using the same authentication system as regular users

## Files Modified/Created

### Created:
- `src/helpers/initializeSuperAdmin.ts` - Initialization logic
- `src/middlewares/isSuperAdmin.ts` - Superadmin validation middleware
- `.env.example` - Updated with SUPERADMIN_PASSWORD

### Modified:
- `src/schemas/users.ts` - Added 'super' to user type enum
- `src/index.ts` - Integrated superadmin initialization on startup
- `src/controllers/users/createAccount.ts` - Prevents manual creation of 'super' type users
