import { Request, Response } from 'express';
import { paginate } from '../helpers/pagination';
import { UserSchema } from '../schemas/users';
import { WorkspaceSchema } from '../schemas/workspaces';
import { authentication, randomToken } from '../helpers';

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

export const getAllUsers = async (req: Request, res: Response) => {
  const currentPage = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;

  try {
    const users = await UserSchema.find();
    const paginatedResult = paginate(users, currentPage, limit, 'users');

    // Si no hay resultados en la página actual, devuelve un error
    if (paginatedResult.results.length === 0 && currentPage !== 1) {
      return res.status(400).json({
        status: "failed",
        message: "There are no results on the current page.",
      });
    }

    // Respuesta con los resultados paginados
    const response = {
      status: 'success',
      users: paginatedResult.results,
      current_page: currentPage,
      total_pages: paginatedResult.totalPages,
      next: paginatedResult.hasNextPage,
      previous: paginatedResult.hasPreviousPage,
      total_items: paginatedResult.totalItems,
      items_on_page: paginatedResult.results.length,
    };
    return res.status(200).json(response);

  } catch (error) {
    console.error(error);
    return res.status(400).json({
      status: 'error',
      message: 'Failed to fetch users',
    });
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'failed',
        message: 'User ID is required',
      });
    }

    const user = await UserSchema.findById({ _id: id })
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An unexpected error occurred',
    });
  }
};

export const getUserByWorkspaceId = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return res.status(400).json({
        status: 'failed',
        message: 'workspaceId is required',
      });
    }

    // Encontrar usuario y poblar información del workspace
    const user = await UserSchema.findOne({ workspaceId }).populate('workspaceId'); 

    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    console.error('Error finding users by workspace ID:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An unexpected error occurred',
    });
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const { idUser, workspaceId } = req.params; // ID del usuario a modificar
    const updateData = req.body; // Datos a actualizar

    // Verificar que workspaceId esté presente
    if (!workspaceId) {
      return res.status(400).json({
        status: "failed",
        message: "workspaceId is required in params",
      });
    }

    // Verificar si el usuario existe
    const user = await UserSchema.findById(idUser);
    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found",
      });
    }

    // Verificar si el workspace existe
    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        status: "failed",
        message: "Workspace not found",
      });
    }

    // Verificar que el workspace le pertenece al usuario
    if (workspace.userId!.toString() !== user._id.toString()) {
      return res.status(403).json({
        status: "failed",
        message: "Workspace does not belong to the specified user",
      });
    }

    // Actualizar el usuario con los datos enviados
    const updatedUser = await UserSchema.findByIdAndUpdate(
      idUser,
      updateData,
      { new: true, runValidators: true }
    );

    // Devolver el usuario actualizado
    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      status: "failed",
      message: "An unexpected error occurred",
    });
  }
};