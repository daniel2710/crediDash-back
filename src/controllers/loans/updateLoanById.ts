import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";

export const updateLoanById = async (req: Request, res: Response) => {
    const { workspaceId, loanId } = req.params;
    const { description, payment_frequency, amount, interest } = req.body;

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

        // Verificar si hay cuotas pagadas (liquidated o partial)
        const hasPaidInstallments = loan.installments.some(
            (inst: any) => inst.status === 'liquidated' || inst.status === 'partial'
        );

        // Validar payment_frequency si se proporciona
        if (payment_frequency) {
            const validFrequencies = ['diary', 'weekly', 'fortnightly', 'monthly'];
            if (!validFrequencies.includes(payment_frequency)) {
                return res.status(400).json({
                    status: 'failed',
                    message: `Invalid payment_frequency. Allowed values: ${validFrequencies.join(', ')}`
                });
            }
        }

        // Si hay cuotas pagadas, solo permitir actualizar descripción
        if (hasPaidInstallments) {
            if (amount !== undefined || interest !== undefined) {
                return res.status(400).json({
                    status: 'failed',
                    message: 'Cannot modify amount or interest when installments have been paid. Only description can be updated.',
                });
            }
            // Actualizar solo descripción y frecuencia
            if (description) loan.description = description;
            if (payment_frequency) loan.payment_frequency = payment_frequency;
        } else {
            // No hay cuotas pagadas, permitir modificar monto e interés
            // Validar valores numéricos primero
            if (amount !== undefined && (typeof amount !== "number" || isNaN(amount) || amount < 0)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid amount value",
                });
            }
            if (interest !== undefined && (typeof interest !== "number" || isNaN(interest) || interest < 0)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid interest value",
                });
            }

            const newAmount = amount !== undefined ? amount : loan.amount;
            const newInterest = (interest !== undefined ? interest : (loan.interest ?? 0));

            // Calcular totales y diferencias antes de modificar
            const currentInterest = (loan.interest ?? 0);
            const oldTotalAmount = loan.amount + loan.amount * (currentInterest / 100);
            const newTotalAmount = newAmount + newAmount * (newInterest / 100);
            const amountDifference = newTotalAmount - oldTotalAmount;
            const amountDiff = amount !== undefined ? newAmount - loan.amount : 0;

            // Actualizar montos
            loan.amount = newAmount;
            loan.interest = newInterest;
            loan.payment_missing = Math.max(0, loan.payment_missing + amountDifference);

            // Recalcular cuotas si existen
            if (loan.installments && loan.installments.length > 0) {
                const amountPerQuota = newTotalAmount / loan.installments.length;
                loan.installments.forEach((inst: any) => {
                    if (inst.status === 'pending') {
                        inst.amount = amountPerQuota;
                    }
                });
            }

            // Actualizar otros campos
            if (description) loan.description = description;
            if (payment_frequency) loan.payment_frequency = payment_frequency;

            // Actualizar estadísticas del workspace
            await WorkspaceSchema.findByIdAndUpdate(
                workspaceId,
                {
                    $inc: {
                        "stats.total_lents": amountDiff,
                        "stats.total_pending": amountDifference,
                    },
                },
                { new: true }
            );
        }

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