import { Request, Response } from "express";
import { UserSchema } from "../../schemas/users";
import { paginate } from "../../helpers/pagination";

export const getAllUsers = async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
  
    try {
      const users = await UserSchema.find();
      const paginatedResult = paginate(users, currentPage, limit, 'users');
  
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
        users: paginatedResult.results,
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