import { Request, Response } from "express";
import { WorkspaceSchema } from "../schemas/workspaces";
import { ClientSchema } from "../schemas/clients";
import { LoansSchema } from "../schemas/loans";
import { validateObjectId } from "../helpers/validateMongo";
import { paginate } from "../helpers/pagination";

export const createLoan = async (req: Request, res: Response) => {
    try {
        const {
            workspaceId,
            clientId,
            status,
            name,
            description,
            amount,
            interest,
            start_date,
            end_date,
            payment_method,
        } = req.body;

        // Verificar que todos los campos sean enviados
        if (
            !workspaceId ||
            !clientId ||
            !status ||
            !name ||
            !description ||
            !amount ||
            !interest ||
            !start_date ||
            !end_date ||
            !payment_method
        ) {
            return res.status(400).json({
                status: "failed",
                message: "All fields are required",
            });
        }

        // Validar que el workspaceId y clientId sea válido
        const workspaceIdError = validateObjectId(workspaceId, 'workspaceId', res);
        if (workspaceIdError) return workspaceIdError;

        const clientIdError = validateObjectId(clientId, 'clientId', res);
        if (clientIdError) return clientIdError;

        // Verificar si el workspace existe
        const workspace = await WorkspaceSchema.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                status: "failed",
                message: "Workspace not found",
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

        // Crear el préstamo
        const newLoan = new LoansSchema({
            workspaceId,
            clientId,
            status,
            name,
            description,
            amount,
            interest,
            start_date,
            end_date,
            payment_method,
        });

        // Guardar el préstamo en la base de datos
        await newLoan.save();

        return res.status(201).json({
            status: "success",
            message: "Loan created successfully",
            loan: newLoan,
        });
    } catch (error) {
        console.error("Error creating loan:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred",
        });
    }
};

export const getAllLoansByClientId = async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;

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

        // Buscar préstamos asociados al cliente
        const loans = await LoansSchema.find({ clientId });
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

export const updateLoan = async (req: Request, res: Response) => {
    const { workspaceId, loanId } = req.params; // ID del préstamo a actualizar
    const { name, description, end_date, payment_method } = req.body; // Campos a actualizar

    try {
        // Validar que el loanId sea válido
        const loanIdError = validateObjectId(loanId, 'loanId', res);
        if (loanIdError) return loanIdError;

        // Validar que el workspaceId sea válido
        const workspaceIdError = validateObjectId(workspaceId, 'workspaceId', res);
        if (workspaceIdError) return workspaceIdError;

        // Verificar que el workspace exista
        const workspaceExists = await WorkspaceSchema.findById(workspaceId);
        if (!workspaceExists) {
            return res.status(404).json({
                status: 'failed',
                message: 'Workspace not found',
            });
        }

        // Buscar el préstamo por ID
        const loan = await LoansSchema.findById(loanId);
        if (!loan) {
            return res.status(404).json({
                status: 'failed',
                message: 'Loan not found',
            });
        }

        // Verificar que el workspace pertenezca al prestamo
        if (loan.workspaceId!.toString() !== workspaceId.toString()) {
            return res.status(403).json({
                status: "failed",
                message: "The loan does not belong to the specified workspace",
            });
        }

        // Actualizar solo los campos recibidos en el cuerpo de la solicitud
        if (name) loan.name = name;
        if (description) loan.description = description;
        if (end_date) loan.end_date = end_date;
        if (payment_method) loan.payment_method = payment_method;

        // Guardar los cambios en el préstamo
        await loan.save();

        return res.status(200).json({
            status: 'success',
            message: 'Loan updated successfully',
            loan,
        });
    } catch (error) {
        console.error('Error updating loan:', error);
        return res.status(500).json({
            status: 'failed',
            message: 'An unexpected error occurred',
        });
    }
};