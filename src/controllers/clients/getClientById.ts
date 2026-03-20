import { Request, Response } from "express";
import { findClientById } from "../../services/clients/getClientById.service";

export const getClientById = async (req: Request, res: Response) => {
    try {
      const { clientId, workspaceId } = req.params;
  
      if (!clientId || !workspaceId) {
        return res.status(400).json({
          status: 'failed',
          message: 'clientId and workspaceId are required',
        });
      }
  
      const client = await findClientById(clientId, workspaceId);
  
      return res.status(200).json({
        status: 'success',
        client,
      });
    } catch (error) {
      console.error('Error fetching client by ID:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const statusCode = errorMessage === 'Client not found or does not belong to the provided workspace' ? 404 : 500;
      
      return res.status(statusCode).json({
        status: 'failed',
        message: errorMessage,
      });
    }
  };