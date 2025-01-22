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
            description,
            amount,
            interest,
            installments_qty,
            payment_method,
        } = req.body;

        // Validar campos obligatorios
        const missingFields = [];
        if (!workspaceId) missingFields.push('workspaceId');
        if (!clientId) missingFields.push('clientId');
        if (!status) missingFields.push('status');
        if (!description) missingFields.push('description');
        if (amount === undefined) missingFields.push('amount');
        if (interest === undefined) missingFields.push('interest');
        if (installments_qty === undefined) missingFields.push('installments_qty');
        if (
            payment_method !== 'diary' &&
            payment_method !== 'monthly' &&
            payment_method !== 'weekly' &&
            payment_method !== 'fortnightly'
        ) missingFields.push('payment_method');

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'failed',
                message: `Missing or invalid fields: ${missingFields.join(', ')}`
            });
        }

        // Validar que los campos numéricos tengan valores válidos
        const numericFields = {
            amount,
            interest,
            installments_qty,
        };

        for (const [field, value] of Object.entries(numericFields)) {
            if (typeof value !== "number" || isNaN(value) || value < 0) {
                return res.status(400).json({
                    status: "failed",
                    message: `Invalid or missing numeric value for field: ${field}`,
                });
            }
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

        // Calcular montos
        const totalAmount = amount + amount * (interest / 100);
        const amountPerQuota = totalAmount / installments_qty;

        // Crear cuotas
        const installments = [];
        const now = new Date();

        for (let i = 0; i < installments_qty; i++) {
            // Crear una nueva instancia de la fecha para evitar referencias compartidas
            const installmentDate = new Date(now);

            // Ajustar la fecha según el método de pago
            switch (payment_method) {
                case 'diary':
                    installmentDate.setDate(now.getDate() + i + 1); // Comienza desde el día siguiente
                    break;
                case 'weekly':
                    installmentDate.setDate(now.getDate() + (i + 1) * 7); // Comienza desde el día siguiente y se incrementa de 7 en 7 días
                    break;
                case 'fortnightly':
                    installmentDate.setDate(now.getDate() + (i + 1) * 15); // Comienza desde el día siguiente y se incrementa de 15 en 15 días
                    break;
                case 'monthly':
                    installmentDate.setDate(now.getDate() + (i + 1) * 30); // Comienza desde el día siguiente y se incrementa de 15 en 15 días
                    break;
                default:
                    throw new Error(`Invalid payment method: ${payment_method}`);
            }

            installments.push({
                status: 'pending',
                amount: amountPerQuota,
                payment_date: null,
                end_date: new Date(installmentDate),
            });
        }

        // Crear el préstamo
        const newLoan = new LoansSchema({
            workspaceId,
            clientId,
            status,
            description,
            amount,
            interest,
            installments_qty,
            installments_info: { paid_installments: 0 },
            installments,
            payment_actual: 0,
            payment_missing: totalAmount,
            payment_method,
        });

        await newLoan.save();

        return res.status(201).json({
            status: "success",
            message: "Loan and installments created successfully",
            loan: newLoan,
        });
    } catch (error) {
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
    const { description, payment_method } = req.body; // Campos a actualizar

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
        if (description) loan.description = description;
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