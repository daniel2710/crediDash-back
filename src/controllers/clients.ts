import { Request, Response } from "express";
import mongoose from "mongoose";
import { WorkspaceSchema } from "../schemas/workspaces";
import { ClientSchema } from "../schemas/clients";
import { paginate } from "../helpers/pagination";

export const createClient = async (req: Request, res: Response) => {
    try {
        const { workspaceId, userId, name, lastname, email, phone, address, description } = req.body;

        // Verificar campos obligatorios
        if (!workspaceId || !userId || !name || !lastname) {
            return res.status(400).json({
                status: "failed",
                message: "workspaceId, userId, name, and lastname are required.",
            });
        }

        // Validar el formato de ObjectId
        if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid workspaceId format.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid userId format.",
            });
        }

        // Verificar si el workspace existe y pertenece al usuario
        const workspace = await WorkspaceSchema.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                status: "failed",
                message: "Workspace not found.",
            });
        }

        if (!workspace.userId!.equals(new mongoose.Types.ObjectId(userId))) {
            return res.status(403).json({
                status: "failed",
                message: "This workspace does not belong to the user.",
            });
        }

        // Verificar si existe un cliente con exactamente los mismos datos
        const duplicateClient = await ClientSchema.findOne({
            workspaceId,
            name,
            lastname,
            email,
            phone,
            address,
            description,
        });

        if (duplicateClient) {
            return res.status(400).json({
                status: "failed",
                message: "A client with the same exact data already exists.",
            });
        }

        // Crear y guardar el nuevo cliente
        const newClient = new ClientSchema({
            workspaceId,
            name,
            lastname,
            email,
            phone,
            address,
            description,
        });

        await newClient.save();

        return res.status(201).json({
            status: "success",
            message: "Client created successfully.",
            client: newClient,
        });
    } catch (error) {
        console.error("Error creating client:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred.",
        });
    }
};

export const getAllClientsByWorkspace = async (req: Request, res: Response) => {
  const currentPage = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;

  try {
    const { workspaceId } = req.params;
  
    // Validar que el workspaceId sea válido
    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid or missing workspaceId',
      });
    }
  
    // Verificar que el workspace exista
    const workspaceExists = await WorkspaceSchema.findById(workspaceId);
    if (!workspaceExists) {
      return res.status(404).json({
        status: 'failed',
        message: 'Workspace not found',
      });
    }

    // Buscar clientes asociados al workspaceId
    const clients = await ClientSchema.find({ workspaceId });
    const paginatedResult = paginate(clients, currentPage, limit, 'users');

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
      clients: paginatedResult.results,
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

export const getClientById = async (req: Request, res: Response) => {
  try {
    const { clientId, workspaceId } = req.params;

    // Validar que el clientId y workspaceId sean válidos
    if (
      !clientId ||
      !workspaceId ||
      !mongoose.Types.ObjectId.isValid(clientId) ||
      !mongoose.Types.ObjectId.isValid(workspaceId)
    ) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid or missing clientId or workspaceId',
      });
    }

    // Buscar cliente por ID y verificar si pertenece al workspace
    const client = await ClientSchema.findOne({ _id: clientId, workspaceId });

    // Verificar si el cliente existe
    if (!client) {
      return res.status(404).json({
        status: 'failed',
        message: 'Client not found or does not belong to the provided workspace',
      });
    }

    // Retornar cliente encontrado
    return res.status(200).json({
      status: 'success',
      client,
    });
  } catch (error) {
    console.error('Error fetching client by ID and workspace:', error);
    return res.status(500).json({
      status: 'failed',
      message: 'An unexpected error occurred',
    });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { clientId, userId } = req.params;

    // Validar si clientId y userId son ObjectId válidos
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid clientId format.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid userId format.",
      });
    }

    // Buscar cliente por clientId
    const client = await ClientSchema.findById(clientId);
    if (!client) {
      return res.status(404).json({
        status: "failed",
        message: "Client not found.",
      });
    }

    // Verificar si el workspace del cliente existe
    const workspace = await WorkspaceSchema.findById(client.workspaceId);
    if (!workspace) {
      return res.status(404).json({
        status: "failed",
        message: "Workspace not found.",
      });
    }

    // Verificar si el workspace pertenece al usuario
    if (!workspace.userId!.equals(new mongoose.Types.ObjectId(userId))) {
      return res.status(403).json({
        status: "failed",
        message: "This workspace does not belong to this user.",
      });
    }

    // Eliminar cliente
    await ClientSchema.findByIdAndDelete(clientId);

    return res.status(200).json({
      status: "success",
      message: "Client deleted successfully.",
      client
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return res.status(500).json({
      status: "failed",
      message: "An unexpected error occurred.",
    });
  }
};

export const updateClientById = async (req: Request, res: Response) => {
  try {
    const { clientId, workspaceId } = req.params; // ID del cliente a modificar
    const updateData = req.body; // Datos a actualizar

    // Verificar que el workspaceId esté presente
    if (!workspaceId) {
      return res.status(400).json({
        status: "failed",
        message: "workspaceId is required",
      });
    }
    
    // Verificar si el workspaceId es válido (opcional, si deseas más seguridad)
    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        status: "failed",
        message: "Workspace not found",
      });
    }

    // Verificar si el cliente existe
    const client = await ClientSchema.findById({ _id: clientId });
    if (!client) {
      return res.status(404).json({
        status: "failed",
        message: "Client not found",
      });
    }

    // Verificar que el workspaceId pertenece al cliente
    if (client.workspaceId!.toString() !== workspaceId) {
      return res.status(403).json({
        status: "failed",
        message: "Client does not belong to the provided workspace",
      });
    }

    // Actualizar el cliente con los datos enviados
    const updatedClient = await ClientSchema.findByIdAndUpdate(
      clientId,
      updateData,
      { new: true, runValidators: true }
    );

    // Devolver el cliente actualizado
    return res.status(200).json({
      status: "success",
      message: "Client updated successfully",
      client: updatedClient,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return res.status(500).json({
      status: "failed",
      message: "An unexpected error occurred",
    });
  }
};