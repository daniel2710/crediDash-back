import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";

export const payLoanAsLiquidated = async (req: Request, res: Response) => {
    try {
        const { loanId, workspaceId } = req.body;

        // Validar campos faltantes
        const missingFields = [];
        if (!loanId) missingFields.push("loanId");
        if (!workspaceId) missingFields.push("workspaceId");

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: "failed",
                message: `Missing fields: ${missingFields.join(", ")}`,
            });
        }

        // Validar que los IDs sean válidos
        const workspaceIdError = validateObjectId(workspaceId, "workspaceId", res);
        if (workspaceIdError) return workspaceIdError;

        const loanIdError = validateObjectId(loanId, "loanId", res);
        if (loanIdError) return loanIdError;

        // Verificar si el workspace existe
        const workspace = await WorkspaceSchema.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                status: "failed",
                message: "Workspace not found",
            });
        }

        // Verificar si el préstamo existe
        const loan = await LoansSchema.findById(loanId);
        if (!loan) {
            return res.status(404).json({
                status: "failed",
                message: "Loan not found",
            });
        }

        // Verificar que el prestamo ya este liquidado
        if (loan.payment_missing === 0) {
            return res.status(400).json({
                status: "failed",
                message: "the loan has already been paid.",
            });
        }

        // Verificar que el préstamo pertenezca al workspace
        if (loan.workspaceId!.toString() !== workspaceId.toString()) {
            return res.status(403).json({
                status: "failed",
                message: "The loan does not belong to the specified workspace",
            });
        }

        // Obtener el monto faltante antes de actualizar el préstamo
        const remainingBalance = loan.payment_missing;

        // Actualizar el estado del préstamo
        loan.status = "liquidated";
        loan.payment_actual = loan.amount;
        loan.payment_missing = 0;

        // Marcar todas las cuotas como liquidadas
        loan.installments.forEach((installment) => {
            installment.status = "liquidated";
            installment.payment = installment.amount;
            installment.payment_date = new Date();
        });

        // Actualizar la información de cuotas pagadas
        loan.installments_info!.paid_installments = loan.installments.length;

        // Agregar al historial con información detallada
        loan.history = loan.history || []; // Inicializar si no existe
        loan.history.push({
            payment_date: new Date(),
            payment: remainingBalance, // Monto faltante para liquidar el préstamo
            remaining_balance: 0, // No hay saldo restante tras liquidar el préstamo
            paid_installments: loan.installments_info!.paid_installments,
            loan_status: "liquidated"
        });

        // Guardar cambios
        await loan.save();

        return res.status(200).json({
            status: "success",
            message: "Loan and installments marked as liquidated successfully",
            updatedLoan: loan,
        });
    } catch (error) {
        console.error("Error marking loan as liquidated:", error);
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred",
        });
    }
};
