import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";

export const updateLoanById = async (req: Request, res: Response) => {
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