import { Request, Response } from "express";
import { findUserByWorkspace } from "../../services/users/getUserByWorkspace.service";

export const getUserByWorkspace = async (req: Request, res: Response) => {
    try {
      const { workspaceId } = req.params;
  
      if (!workspaceId) {
        return res.status(400).json({
          status: 'failed',
          message: 'workspaceId is required',
        });
      }
  
      const user = await findUserByWorkspace(workspaceId);
  
      return res.status(200).json({
        status: 'success',
        user,
      });
    } catch (error) {
      console.error('Error finding users by workspace ID:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const statusCode = errorMessage === 'User not found' ? 404 : 500;
      
      return res.status(statusCode).json({
        status: 'failed',
        message: errorMessage,
      });
    }
  };