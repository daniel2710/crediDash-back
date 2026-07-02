import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { ClientSchema } from "../../schemas/clients";
import { LoansSchema } from "../../schemas/loans";
import { paginate } from "../../helpers/pagination";

export const getAllLoansByClient = async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

    const { status, payment_frequency, start_date_from, start_date_to, search } = req.query;

    try {
        const { workspaceId, clientId } = req.params;

        // Validar que el workspaceId y clientId sea válido
        const workspaceError = validateObjectId(workspaceId, 'workspaceId', res);
        if (workspaceError) return workspaceError;

        const clientError = validateObjectId(clientId, 'clientId', res);
        if (clientError) return clientError;

        // Verificar que el workspace exista
        const workspaceExists = await WorkspaceSchema.findById(workspaceId);
        if (!workspaceExists) {
            return res.status(404).json({
                status: 'failed',
                message: 'Workspace not found',
            });
        }

        // Verificar si el cliente existe
        const client = await ClientSchema.findById(clientId);
        if (!client) {
            return res.status(404).json({
                status: "failed",
                message: "Client not found",
            });
        }

        // Verificar que el workspace pertenezca al cliente
        if (client.workspaceId!.toString() !== workspaceId.toString()) {
            return res.status(403).json({
                status: "failed",
                message: "The client does not belong to the specified workspace",
            });
        }

        // Validar status si se proporciona
        const validStatuses = ['pending', 'liquidated', 'partial', 'late'];
        if (status && !validStatuses.includes(status as string)) {
            return res.status(400).json({
                status: "failed",
                message: `Invalid status filter. Allowed values: ${validStatuses.join(', ')}`,
            });
        }

        // Validar payment_frequency si se proporciona
        const validFrequencies = ['diary', 'weekly', 'fortnightly', 'monthly'];
        if (payment_frequency && !validFrequencies.includes(payment_frequency as string)) {
            return res.status(400).json({
                status: "failed",
                message: `Invalid payment_frequency filter. Allowed values: ${validFrequencies.join(', ')}`,
            });
        }

        // Construir filtros dinámicos
        const query: Record<string, any> = { clientId };

        if (status) query.status = status;
        if (payment_frequency) query.payment_frequency = payment_frequency;
        if (start_date_from || start_date_to) {
            query.start_date = {};
            if (start_date_from) query.start_date.$gte = new Date(start_date_from as string);
            if (start_date_to) query.start_date.$lte = new Date(start_date_to as string);
        }

        // Filtro de búsqueda por descripción del préstamo
        if (search) {
            query.description = new RegExp(search as string, 'i');
        }

        // Buscar préstamos asociados al cliente
        const loans = await LoansSchema.find(query);
        const paginatedResult = paginate(loans, currentPage, limit, 'loans');

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
        console.error(error);
        return res.status(400).json({
            status: 'error',
            message: 'Failed to fetch users',
        });
    }
};