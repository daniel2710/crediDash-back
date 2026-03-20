import { Request, Response } from "express";
import { findAllWorkspaces } from "../../services/workspaces/getAllWorkspaces.service";

export const getAllWorkspaces = async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = 10;

    try {
      const result = await findAllWorkspaces(currentPage, limit);
  
      return res.status(200).json({
        status: 'success',
        ...result,
      });
  
    } catch (error) {
      console.error(error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch workspaces';
      const statusCode = errorMessage === 'There are no results on the current page.' ? 400 : 500;
      
      return res.status(statusCode).json({
        status: 'failed',
        message: errorMessage,
      });
    }
  };
