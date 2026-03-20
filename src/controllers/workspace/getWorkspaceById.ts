import { Request, Response } from "express";
import { findWorkspaceById } from "../../services/workspaces/getWorkspaceById.service";

export const getWorkspaceById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: 'failed',
          message: 'Workspace ID is required',
        });
      }

      const workspace = await findWorkspaceById(id);
  
      return res.status(200).json({
        status: 'success',
        workspace,
      });
    } catch (error) {
      console.error('Error finding workspace by ID:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const statusCode = errorMessage === 'Workspace not found' ? 404 : 500;
      
      return res.status(statusCode).json({
        status: 'failed',
        message: errorMessage,
      });
    }
  };
