import { Request, Response } from "express";
import { authentication, randomToken } from "../../helpers";
import { UserSchema } from "../../schemas/users";
import { WorkspaceSchema } from "../../schemas/workspaces";

export const create_account = async (req: Request, res: Response) => {
    let savedUser = null;  // Declarar la variable aquí, fuera del try-catch
  
    try {
        const { 
            name, 
            lastname, 
            email, 
            password, 
            type 
        } = req.body;
  
        // Validar campos obligatorios
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!lastname) missingFields.push('lastname');
        if (!email) missingFields.push('email');
        if (!password) missingFields.push('password');
        if (!type || !['admin', 'reviewer'].includes(type)) {
            missingFields.push('type (must be admin or reviewer)');
        }
  
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                status: 'failed', 
                message: `Missing or invalid fields: ${missingFields.join(', ')}` 
            });
        }
  
        // Normalizar entradas
        const normalizedEmail = email.toLowerCase();
        const normalizedName = name.toLowerCase();
        const normalizedLastname = lastname.toLowerCase();
  
        // Verificar si el correo electrónico ya está registrado
        const existingUser = await UserSchema.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ 
                status: 'failed', 
                message: 'User with this email already exists' 
            });
        }
  
        // Generar salt y hash de contraseña
        const salt = randomToken();
  
        // Crear usuario
        const newUser = new UserSchema({
            name: normalizedName,
            lastname: normalizedLastname,
            email: normalizedEmail,
            type,
            authentication: {
                salt,
                password: authentication(salt, password),
            },
        });
  
        // Guardar el usuario
        savedUser = await newUser.save();
  
        // Crear workspace
        const newWorkspace = new WorkspaceSchema({
            userId: savedUser._id,
            plan: 'free',  // O según los parámetros de tu app
            interface_config: { theme: 'light' }, // Puedes ajustarlo según lo que necesites
        });
  
        const savedWorkspace = await newWorkspace.save();
  
        // Si ambas operaciones son exitosas, actualizar el usuario con su workspaceId
        savedUser.workspaceId = savedWorkspace._id;
        await savedUser.save();
  
        return res.status(201).json({
            status: 'success',
            message: 'User and workspace created successfully',
            user: savedUser,
            workspace: savedWorkspace,
        });
    } catch (error) {
        console.error('Error creating account:', error);
  
        // Si hubo un error, hacer rollback (eliminar el usuario creado previamente)
        if (savedUser) {
            await UserSchema.findByIdAndDelete(savedUser._id);
        }
  
        return res.status(500).json({
            status: 'failed',
            message: 'An unexpected error occurred. Rollback executed.',
        });
    }
  };