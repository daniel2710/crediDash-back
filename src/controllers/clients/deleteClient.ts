import { Request, Response } from "express";
import mongoose from "mongoose";
import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";

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