import { Request, Response } from "express";
import { updateUser } from "../../services/users/users.service";

export const updateUserById = async (req: Request, res: Response) => {
    try {
      const { idUser, workspaceId } = req.params;
      const updateData = req.body;

      if (!workspaceId) {
        return res.status(400).json({
          status: "failed",
          message: "workspaceId is required in params",
        });
      }

      const updatedUser = await updateUser(idUser, workspaceId, updateData);

      return res.status(200).json({
        status: "success",
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      let statusCode = 500;
      
      if (errorMessage === 'User not found') statusCode = 404;
      else if (errorMessage === 'Workspace not found') statusCode = 404;
      else if (errorMessage === 'Workspace does not belong to the specified user') statusCode = 403;

      return res.status(statusCode).json({
        status: "failed",
        message: errorMessage,
      });
    }
  };