import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";
import { checkAndUpdateLateStatus } from "../../helpers/checkLateStatus";

// Función para procesar pagos estándar (lógica existente)
const processStandardPayment = (paymentAmount: number, installments: any[]) => {
    let extraPayment = paymentAmount;
    const processedInstallments: any[] = [];
    
    for (let i = 0; i < installments.length; i++) {
        const installment = installments[i];

        // Procesar solo cuotas pendientes
        if (installment.status === "liquidated") continue;
        
        // En pago estándar, procesar en orden estricto:
        // 1. Si hay cuotas parciales, completarlas primero
        // 2. Si no hay cuotas parciales, procesar la primera pendiente
        if (installment.status === "partial" && installment.payment > 0) {
            // Completar cuota parcial existente
            const previousStatus = installment.status;
            const paymentMissing = installment.amount - installment.payment;
            let amountPaid = 0;

            if (extraPayment >= paymentMissing) {
                // Completar esta cuota parcial
                amountPaid = paymentMissing;
                installment.payment = installment.amount;
                installment.payment_date = new Date();
                installment.status = "liquidated";
                extraPayment -= paymentMissing;
            } else {
                // Pago adicional a la cuota parcial
                amountPaid = extraPayment;
                installment.payment += extraPayment;
                installment.payment_date = new Date();
                installment.status = "partial";
                extraPayment = 0;
                break; // Salir del bucle porque el pago ya se procesó
            }

            // Registrar la cuota procesada
            processedInstallments.push({
                installment_id: installment._id,
                amount_paid: amountPaid,
                previous_status: previousStatus,
                new_status: installment.status
            });
            continue; // Continuar al siguiente ciclo
        }

        // Si no hay cuotas parciales, procesar la primera cuota pendiente
        if (installment.status === "pending") {
            const previousStatus = installment.status;
            const paymentMissing = installment.amount - installment.payment; // cuánto queda por pagar para liquidar esa cuota
            let amountPaid = 0;

            if (extraPayment >= paymentMissing) {
                // Pago completo de esta cuota
                amountPaid = paymentMissing;
                installment.payment = installment.amount;
                installment.payment_date = new Date();
                installment.status = "liquidated";
                extraPayment -= paymentMissing;
            } else {
                // Pago parcial de esta cuota
                amountPaid = extraPayment;
                installment.payment += extraPayment;
                installment.payment_date = new Date();
                installment.status = "partial";
                extraPayment = 0;
                break; // Salir del bucle porque el pago ya se procesó
            }

            // Registrar la cuota procesada
            processedInstallments.push({
                installment_id: installment._id,
                amount_paid: amountPaid,
                previous_status: previousStatus,
                new_status: installment.status
            });
        }
    }

    return processedInstallments;
};


// Función para procesar pago de una cuota específica por ID
const processSpecificInstallment = (installmentId: string, paymentAmount: number, installments: any[]) => {
    const installment = installments.find(inst => inst._id.toString() === installmentId);
    
    if (!installment) {
        throw new Error(`Installment with ID ${installmentId} not found`);
    }
    
    if (installment.status === "liquidated") {
        throw new Error(`Installment with ID ${installmentId} is already liquidated`);
    }
    
    // Permitir completar cuotas parciales - solo validar que no esté liquidada
    
    const previousStatus = installment.status;
    const paymentMissing = installment.amount - installment.payment;
    
    if (paymentAmount > paymentMissing) {
        throw new Error(`Payment amount ${paymentAmount} exceeds the remaining balance ${paymentMissing} for this installment`);
    }
    
    let amountPaid = paymentAmount;
    
    if (paymentAmount >= paymentMissing) {
        // Liquidar la cuota
        amountPaid = paymentMissing;
        installment.payment = installment.amount;
        installment.payment_date = new Date();
        installment.status = "liquidated";
    } else {
        // Pago parcial
        installment.payment += paymentAmount;
        installment.payment_date = new Date();
        installment.status = "partial";
    }
    
    return [{
        installment_id: installment._id,
        amount_paid: amountPaid,
        previous_status: previousStatus,
        new_status: installment.status
    }];
};

export const payInstallment = async (req: Request, res: Response) => {

    try {
        const {
            loanId,
            workspaceId,
            paymentAmount,
            installmentId,
        } = req.body;

        const missingFields = [];
        if (!loanId) missingFields.push('loanId');
        if (!workspaceId) missingFields.push('workspaceId');
        if (typeof paymentAmount !== "number" || isNaN(paymentAmount) || paymentAmount <= 0) missingFields.push('paymentAmount');
        if (installmentId && typeof installmentId !== "string") missingFields.push('installmentId must be a string');

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

        // Validar que el monto de pago no exceda el saldo pendiente
        if (paymentAmount > loan.payment_missing) {
            return res.status(400).json({
                status: "failed",
                message: `Payment amount cannot exceed the remaining balance of ${loan.payment_missing}`,
            });
        }

        // No se necesitan validaciones de isCustomPayment ya que se eliminó el parámetro

        // Verificar y actualizar el estado de cuotas atrasadas antes de procesar el pago
        const updatedLoan = await checkAndUpdateLateStatus(loanId);

        // Iterar sobre las cuotas pendientes (usar el préstamo actualizado)
        const installments = updatedLoan!.installments;

        // Procesar el pago según el tipo (específico o estándar)
        let processedInstallments: any[] = [];
        
        try {
            if (installmentId) {
                // Pago de cuota específica por ID
                processedInstallments = processSpecificInstallment(installmentId, paymentAmount, installments);
            } else {
                // Lógica estándar: procesar siguiente cuota pendiente en orden
                processedInstallments = processStandardPayment(paymentAmount, installments);
            }
        } catch (paymentError: any) {
            return res.status(400).json({
                status: "failed",
                message: `Payment processing error: ${paymentError.message}`,
            });
        }

        // Actualizar el estado del préstamo (usar updatedLoan que tiene las cuotas modificadas)
        updatedLoan!.payment_actual += paymentAmount;
        updatedLoan!.payment_missing -= paymentAmount;

        if (updatedLoan!.payment_missing <= 0) {
            updatedLoan!.status = "liquidated";
            updatedLoan!.payment_missing = 0;
        } else if (updatedLoan!.payment_actual > 0) {
            updatedLoan!.status = "partial";
        }

        // Incrementar la cantidad de cuotas pagadas
        updatedLoan!.installments_info!.paid_installments = installments.filter(
            (inst) => inst.status === "liquidated"
        ).length;

        // Registrar la historia del pago con información detallada
        const paidInstallmentIds = processedInstallments
            .filter(inst => inst.new_status === "liquidated")
            .map(inst => inst.installment_id);

        updatedLoan!.history.push({
            payment_date: new Date(),
            payment: paymentAmount,
            remaining_balance: updatedLoan!.payment_missing,
            paid_installments: updatedLoan!.installments_info!.paid_installments,
            loan_status: updatedLoan!.status,
            paid_installment_ids: paidInstallmentIds,
            installment_details: processedInstallments
        });

        await updatedLoan!.save();

        // Actualizar las estadísticas en workspace.stats
        await WorkspaceSchema.findByIdAndUpdate(
            workspaceId,
            {
                $inc: {
                    // Reducir los préstamos activos si el préstamo fue liquidado.
                    "stats.active_loans":
                        updatedLoan!.status === "liquidated" ? -1 : 0,

                    // Aumentamos el total liquidado si el préstamo fue liquidado.
                    "stats.liquidate_loans":
                        updatedLoan!.status === "liquidated" ? 1 : 0,

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
            updatedLoan: updatedLoan,
        });

    } catch (error) {
        return res.status(500).json({
            status: "failed",
            message: "An unexpected error occurred",
        });
    }
}