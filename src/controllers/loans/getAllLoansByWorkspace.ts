import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { UserSchema } from "../../schemas/users";
import { LoansSchema } from "../../schemas/loans";
import { paginate } from "../../helpers/pagination";
import { checkAndUpdateAllLateLoans } from "../../helpers/checkLateStatus";

export const getAllLoansByWorkspace = async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    
    try {
        const { workspaceId, userId } = req.params;

        // Validar el workspaceId y el userId
        const workspaceIdError = validateObjectId(workspaceId, "workspaceId", res);
        if (workspaceIdError) return workspaceIdError;

        const userIdError = validateObjectId(userId, "userId", res);
        if (userIdError) return userIdError;

        // Verificar si el workspace existe
        const workspace = await WorkspaceSchema.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                status: "failed",
                message: "Workspace not found",
            });
        }

        // Verificar si el user existe
        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "failed",
                message: "User not found",
            });
        }

        // Verificar que el workspace le pertenece al usuario
        if (workspace.userId!.toString() !== user._id.toString()) {
            return res.status(403).json({
                status: "failed",
                message: "Workspace does not belong to the specified user",
            });
        }

        // Actualizar el estado de préstamos atrasados antes de obtenerlos
        await checkAndUpdateAllLateLoans(workspaceId);

        // Obtener los préstamos asociados al workspace
        const loans = await LoansSchema.find({ workspaceId }).populate("installments");
        const paginatedResult = paginate(loans, currentPage, limit, 'loans');

        // Respuesta con los resultados paginados
        const response = {
            status: 'success',
            loans: paginatedResult.results,
            current_page: currentPage,
            total_pages: paginatedResult.totalPages,
            next: paginatedResult.hasNextPage,
            previous: paginatedResult.hasPreviousPage,
            total_items: paginatedResult.totalItems,
            items_on_page: paginatedResult.results.length,
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("Error retrieving loans by workspace:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred",
        });
    }
};