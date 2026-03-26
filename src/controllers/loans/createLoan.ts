import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { ClientSchema } from "../../schemas/clients";
import { LoansSchema } from "../../schemas/loans";

export const createLoan = async (req: Request, res: Response) => {
    try {
        const {
            workspaceId,
            clientId,
            status,
            description,
            // monto
            amount,
            // interes
            interest,
            // cantidad de cuotas
            installments_qty,
            // frecuencia de pago
            payment_frequency,
            // fecha de inicio
            start_date,
        } = req.body;

        // Validar y establecer valor por defecto para status
        const validStatuses = ['pending', 'liquidated', 'partial', 'late'];
        const loanStatus = status || 'pending';
        
        if (!validStatuses.includes(loanStatus)) {
            return res.status(400).json({
                status: 'failed',
                message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
            });
        }

        // Establecer valor por defecto para interest
        const loanInterest = interest !== undefined ? interest : 0;

        // Validar y establecer payment_frequency si se proporciona
        const validFrequencies = ['diary', 'weekly', 'fortnightly', 'monthly'];
        if (payment_frequency && !validFrequencies.includes(payment_frequency)) {
            return res.status(400).json({
                status: 'failed',
                message: `Invalid payment_frequency. Allowed values: ${validFrequencies.join(', ')}`
            });
        }

        // Validar campos obligatorios
        const missingFields = [];
        if (!workspaceId) missingFields.push('workspaceId');
        if (!clientId) missingFields.push('clientId');
        if (amount === undefined) missingFields.push('amount');
        if (installments_qty === undefined) missingFields.push('installments_qty');

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'failed',
                message: `Missing or invalid fields: ${missingFields.join(', ')}`
            });
        }

        // Validar que los campos numéricos tengan valores válidos
        const numericFields = {
            amount,
            interest: loanInterest,
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
        const totalAmount = amount + amount * (loanInterest / 100);
        const amountPerQuota = totalAmount / installments_qty;

        // Crear cuotas
        const installments = [];
        // Usar start_date si se proporciona, de lo contrario usar la fecha actual
        const baseDate = start_date ? new Date(start_date) : new Date();

        for (let i = 0; i < installments_qty; i++) {
            // Crear una nueva instancia de la fecha para evitar referencias compartidas
            const installmentDate = new Date(baseDate);

            // Ajustar la fecha según la frecuencia de pago (solo si se especifica)
            if (payment_frequency) {
                switch (payment_frequency) {
                    case 'diary':
                        installmentDate.setDate(baseDate.getDate() + i + 1); // Comienza desde el día siguiente
                        break;
                    case 'weekly':
                        installmentDate.setDate(baseDate.getDate() + (i + 1) * 7); // Comienza desde el día siguiente y se incrementa de 7 en 7 días
                        break;
                    case 'fortnightly':
                        installmentDate.setDate(baseDate.getDate() + (i + 1) * 15); // Comienza desde el día siguiente y se incrementa de 15 en 15 días
                        break;
                    case 'monthly':
                        installmentDate.setDate(baseDate.getDate() + (i + 1) * 30); // Comienza desde el día siguiente y se incrementa de 30 en 30 días
                        break;
                }
            }

            installments.push({
                status: 'pending',
                amount: amountPerQuota,
                payment_date: null,
                end_date: payment_frequency ? new Date(installmentDate) : null,
            });
        }

        // Crear el préstamo
        const newLoan = new LoansSchema({
            workspaceId,
            clientId,
            status: loanStatus,
            description,
            amount,
            interest: loanInterest,
            installments_qty,
            installments_info: { paid_installments: 0 },
            installments,
            payment_actual: 0,
            payment_missing: totalAmount,
            payment_frequency: payment_frequency || null,
            start_date: start_date ? new Date(start_date) : new Date(),
        });

        await newLoan.save();

        // Actualizar las estadísticas en workspace.stats
        await WorkspaceSchema.findByIdAndUpdate(
            workspaceId,
            { 
                $inc: {
                    "stats.total_loans": 1,
                    "stats.active_loans": 1,
                    "stats.total_lents": amount,
                    "stats.total_pending": totalAmount
                }
            },
            { new: true }
        );

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