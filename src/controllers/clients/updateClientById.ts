import { Request, Response } from "express";
import { updateClientById as updateClientService } from "../../services/clients/updateClientById.service";

export const updateClientById = async (req: Request, res: Response) => {
    try {
      const { clientId, workspaceId } = req.params;
      const updateData = req.body;

      if (!workspaceId) {
        return res.status(400).json({
          status: "failed",
          message: "workspaceId is required",
        });
      }

      const updatedClient = await updateClientService(clientId, workspaceId, updateData);

      return res.status(200).json({
        status: "success",
        message: "Client updated successfully",
        client: updatedClient,
      });
    } catch (error) {
      console.error("Error updating client:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      let statusCode = 500;

      if (errorMessage === 'Workspace not found') statusCode = 404;
      else if (errorMessage === 'Client not found') statusCode = 404;
      else if (errorMessage === 'Client does not belong to the provided workspace') statusCode = 403;

      return res.status(statusCode).json({
        status: "failed",
        message: errorMessage,
      });
    }
  };