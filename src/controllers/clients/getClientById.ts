import mongoose from "mongoose";
import { ClientSchema } from "../../schemas/clients";
import { Request, Response } from "express";

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