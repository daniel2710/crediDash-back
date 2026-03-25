import { Request, Response } from "express";
import { findAllClientsByWorkspace } from "../../services/clients/getAllClientsByWorkspace.service";

export const getAllClientsByWorkspace = async (req: Request, res: Response): Promise<Response> => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const searchTerm = req.query.search as string | undefined;

    try {
      const { workspaceId } = req.params;
    
      if (!workspaceId) {
        return res.status(400).json({
          status: 'failed',
          message: 'workspaceId is required',
        });
      }

      const result = await findAllClientsByWorkspace(workspaceId, currentPage, limit, searchTerm);
  
      return res.status(200).json({
        status: 'success',
        ...result,
      });
  
    } catch (error) {
      console.error(error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch clients';
      let statusCode = 500;

      if (errorMessage === 'Workspace not found') statusCode = 404;
      else if (errorMessage === 'There are no results on the current page.') statusCode = 400;
      
      return res.status(statusCode).json({
        status: 'failed',
        message: errorMessage,
      });
    }
  };