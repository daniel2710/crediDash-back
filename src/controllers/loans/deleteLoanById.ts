import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";

export const deleteLoanById = async (req: Request, res: Response) => {
    const { workspaceId, loanId } = req.params;

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

        // Actualizar las estadísticas del workspace antes de eliminar
        const isLoanActive = loan.status !== 'liquidated';
        const updateStats: any = {
            $inc: {
                "stats.total_loans": -1,
            }
        };

        if (isLoanActive) {
            updateStats.$inc["stats.active_loans"] = -1;
            updateStats.$inc["stats.total_pending"] = -loan.payment_missing;
        } else {
            updateStats.$inc["stats.liquidate_loans"] = -1;
            updateStats.$inc["stats.total_incomes"] = -loan.payment_actual;
        }

        await WorkspaceSchema.findByIdAndUpdate(workspaceId, updateStats);

        // Eliminar el préstamo (y sus cuotas embebidas)
        await LoansSchema.findByIdAndDelete(loanId);

        return res.status(200).json({
            status: 'success',
            message: 'Loan and related installments deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting loan:', error);
        return res.status(500).json({
            status: 'failed',
            message: 'An unexpected error occurred',
        });
    }
};
