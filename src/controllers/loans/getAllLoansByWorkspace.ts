import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { UserSchema } from "../../schemas/users";
import { ClientSchema } from "../../schemas/clients";
import { LoansSchema } from "../../schemas/loans";
import { paginate } from "../../helpers/pagination";
import { checkAndUpdateAllLateLoans } from "../../helpers/checkLateStatus";

export const getAllLoansByWorkspace = async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

    const { client, status, payment_frequency, start_date_from, start_date_to, search } = req.query;
    
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

        // Validar client si se proporciona
        if (client) {
            const clientIdError = validateObjectId(client as string, "client", res);
            if (clientIdError) return clientIdError;
        }

        // Actualizar el estado de préstamos atrasados antes de obtenerlos
        await checkAndUpdateAllLateLoans(workspaceId);

        // Construir filtros dinámicos
        const query: Record<string, any> = { workspaceId };

        if (client) query.clientId = client;
        if (status) query.status = status;
        if (payment_frequency) query.payment_frequency = payment_frequency;
        if (start_date_from || start_date_to) {
            query.start_date = {};
            if (start_date_from) query.start_date.$gte = new Date(start_date_from as string);
            if (start_date_to) query.start_date.$lte = new Date(start_date_to as string);
        }

        // Filtro de búsqueda por descripción o nombre/apellido del cliente
        if (search) {
            const searchRegex = new RegExp(search as string, 'i');
            const matchingClients = await ClientSchema.find(
                { workspaceId, $or: [{ name: searchRegex }, { lastname: searchRegex }] },
                { _id: 1 }
            );
            const matchingClientIds = matchingClients.map(c => c._id);
            query.$or = [
                { description: searchRegex },
                { clientId: { $in: matchingClientIds } },
            ];
        }

        // Obtener los préstamos asociados al workspace con info del cliente
        const loans = await LoansSchema.find(query)
            .populate("installments")
            .populate("clientId", "name lastname phone address");

        // Transformar los préstamos para renombrar clientId a client
        const loansWithClient = loans.map(loan => {
            const loanObj = loan.toObject() as any;
            loanObj.client = loanObj.clientId;
            delete loanObj.clientId;
            return loanObj;
        });

        const paginatedResult = paginate(loansWithClient, currentPage, limit, 'loans');

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