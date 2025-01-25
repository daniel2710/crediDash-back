import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";

export const payInstallment = async (req: Request, res: Response) => {

    try {
        const {
            loanId,
            workspaceId,
            paymentAmount,
        } = req.body;

        const missingFields = [];
        if (!loanId) missingFields.push('loanId');
        if (!workspaceId) missingFields.push('workspaceId');
        if (typeof paymentAmount !== "number" || isNaN(paymentAmount) || paymentAmount < 0) missingFields.push('paymentAmount');

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'failed',
                message: `Missing or invalid fields: ${missingFields.join(', ')}`
            });
        }

        // Validar que el workspaceId y loanId sea válido
        const workspaceIdError = validateObjectId(workspaceId, 'workspaceId', res);
        if (workspaceIdError) return workspaceIdError;

        const loanIdError = validateObjectId(loanId, 'loanId', res);
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

        // Verificar que el workspace pertenezca al prestamo
        if (loan.workspaceId!.toString() !== workspaceId.toString()) {
            return res.status(403).json({
                status: "failed",
                message: "The loan does not belong to the specified workspace",
            });
        }

        // Verificar que el prestamo ya este liquidado
        if (loan.payment_missing === 0) {
            return res.status(400).json({
                status: "failed",
                message: "the loan has already been paid.",
            });
        }

        // Iterar sobre las cuotas pendientes
        let extraPayment = paymentAmount; // Cantidad a procesar (110.000)
        const installments = loan.installments;

        // Recorremos todas las cuotas (installments) de un préstamo, y si el pago es menor a la cuota, lo procesamos y se abona, queda con el status 'partial' y se acaba el bucle ya que no queda dinero (extraPayment) para la siguiente cuota. Si el pago es mayor a la cuota, lo procesamos y se abona, queda con el status 'liquidated' y sigue el bucle hasta que la siguiente cuota quede como 'liquidate' y no quede más dinero (extraPayment).
        for (let i = 0; i < installments.length; i++) {
            const installment = installments[i];

            // Procesar solo cuotas pendientes
            if (installment.status === "liquidated") continue;

            const paymentMissing = installment.amount - installment.payment; // cuánto queda por pagar para liquidar esa cuota

            if (extraPayment >= paymentMissing) {
                // Pago completo de esta cuota
                installment.payment = installment.amount;
                installment.payment_date = new Date();
                installment.status = "liquidated";
                extraPayment -= paymentMissing;
            } else if (extraPayment > 0) {
                // Pago parcial de esta cuota
                installment.payment += extraPayment;
                installment.payment_date = new Date();
                installment.status = "partial";
                extraPayment = 0;
                break; // Salir del bucle porque el pago ya se procesó
            } else {
                // Sin dinero para procesar, salir del bucle
                break;
            }
        }

        // Actualizar el estado del préstamo
        loan.payment_actual += paymentAmount;
        loan.payment_missing -= paymentAmount;

        if (loan.payment_missing <= 0) {
            loan.status = "liquidated";
            loan.payment_missing = 0;
        } else if (loan.payment_actual > 0) {
            loan.status = "partial";
        }

        // Incrementar la cantidad de cuotas pagadas
        loan.installments_info!.paid_installments = installments.filter(
            (inst) => inst.status === "liquidated"
        ).length;

        // Registrar la historia del pago
        loan.history.push({
            payment_date: new Date(),
            payment: paymentAmount,
            remaining_balance: loan.payment_missing
        });

        await loan.save();

        // Actualizar las estadísticas en workspace.stats
        await WorkspaceSchema.findByIdAndUpdate(
            workspaceId,
            {
                $inc: {
                    // Reducir los préstamos activos si el préstamo fue liquidado.
                    "stats.active_loans":
                        loan.status === "liquidated" ? -1 : 0,

                    // Aumentamos el total liquidado si el préstamo fue liquidado.
                    "stats.liquidate_loans":
                        loan.status === "liquidated" ? 1 : 0,

                    // Aumentamos los ingresos por el monto total pagado independiente si el préstamo fue liquidado o no.
                    "stats.total_incomes": paymentAmount,
                    
                    // reducimos la cartera por el monto total pagado independiente si el préstamo fue liquidado o no.
                    "stats.total_pending": -paymentAmount,
                },
            },
            { new: true }
        );

        return res.status(201).json({
            status: "success",
            message: "Payment processed successfully",
            updatedLoan: loan,
        });

    } catch (error) {
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred",
        });
    }
}