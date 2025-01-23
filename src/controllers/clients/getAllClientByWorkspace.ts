import { Request, Response } from "express";
import mongoose from "mongoose";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { ClientSchema } from "../../schemas/clients";
import { paginate } from "../../helpers/pagination";

export const getAllClientsByWorkspace = async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
  
    try {
      const { workspaceId } = req.params;
    
      // Validar que el workspaceId sea válido
      if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid or missing workspaceId',
        });
      }
    
      // Verificar que el workspace exista
      const workspaceExists = await WorkspaceSchema.findById(workspaceId);
      if (!workspaceExists) {
        return res.status(404).json({
          status: 'failed',
          message: 'Workspace not found',
        });
      }
  
      // Buscar clientes asociados al workspaceId
      const clients = await ClientSchema.find({ workspaceId });
      const paginatedResult = paginate(clients, currentPage, limit, 'users');
  
      // Si no hay resultados en la página actual, devuelve un error
      if (paginatedResult.results.length === 0 && currentPage !== 1) {
        return res.status(400).json({
          status: "failed",
          message: "There are no results on the current page.",
        });
      }
  
      // Respuesta con los resultados paginados
      const response = {
        status: 'success',
        clients: paginatedResult.results,
        current_page: currentPage,
        total_pages: paginatedResult.totalPages,
        next: paginatedResult.hasNextPage,
        previous: paginatedResult.hasPreviousPage,
        total_items: paginatedResult.totalItems,
        items_on_page: paginatedResult.results.length,
      };
      return res.status(200).json(response);
  
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to fetch users',
      });
    }
  };