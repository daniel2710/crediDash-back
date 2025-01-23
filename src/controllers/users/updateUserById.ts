import { Request, Response } from "express";
import { UserSchema } from "../../schemas/users";
import { WorkspaceSchema } from "../../schemas/workspaces";

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