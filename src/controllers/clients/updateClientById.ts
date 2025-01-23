import { Request, Response } from "express";
import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";

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