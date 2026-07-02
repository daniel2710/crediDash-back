import { Request, Response } from "express";
import { deleteClientById } from "../../services/clients/deleteClient.service";

export const deleteClient = async (req: Request, res: Response) => {
    try {
      const { clientId, userId } = req.params;
  
      if (!clientId || !userId) {
        return res.status(400).json({
          status: "failed",
          message: "clientId and userId are required",
        });
      }
  
      const client = await deleteClientById(clientId, userId);
  
      return res.status(200).json({
        status: "success",
        message: "Client deleted successfully.",
        client
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      let statusCode = 500;

      if (errorMessage === 'Client not found') statusCode = 404;
      else if (errorMessage === 'Workspace not found') statusCode = 404;
      else if (errorMessage === 'This workspace does not belong to this user') statusCode = 403;
      else if (errorMessage === 'Client has active loans and cannot be deleted') statusCode = 409;

      return res.status(statusCode).json({
        status: "failed",
        message: errorMessage,
      });
    }
  };