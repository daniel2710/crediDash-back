import { LoansSchema } from "../../schemas/loans";
import { WorkspaceSchema } from "../../schemas/workspaces";

type TimeFilter = 'week' | 'month';

export const getProgressStatistics = async (userId: string, timeFilter: TimeFilter = 'month') => {
    // Obtener todos los workspaces del usuario
    const workspaces = await WorkspaceSchema.find({ userId });
    
    if (!workspaces || workspaces.length === 0) {
        throw new Error('No workspaces found for this user');
    }

    const workspaceIds = workspaces.map(ws => ws._id);
    
    // Calcular fecha de inicio según el filtro
    const now = new Date();
    const startDate = new Date();
    
    if (timeFilter === 'week') {
        startDate.setDate(now.getDate() - 7);
    } else if (timeFilter === 'month') {
        startDate.setMonth(now.getMonth() - 1);
    }

    // Obtener todos los préstamos de los workspaces del usuario
    const loans = await LoansSchema.find({
        workspaceId: { $in: workspaceIds }
    });

    // Total a cobrar
    let totalToCollect = 0;

    // Total cobrado
    let totalCollected = 0;
    
    // Saldo pendiente
    let pendingBalance = 0;

    loans.forEach(loan => {
        // Filtrar cuotas según el rango de fechas
        loan.installments.forEach(installment => {
            const endDate = new Date(installment.end_date);
            
            // Solo considerar cuotas dentro del rango de fechas
            if (endDate >= startDate && endDate <= now) {
                totalToCollect += installment.amount;
                
                // Sumar lo cobrado (pagos realizados)
                if (installment.payment > 0) {
                    totalCollected += installment.payment;
                }
            }
        });
    });

    // Calcular saldo pendiente
    pendingBalance = totalToCollect - totalCollected;

    return {
        timeFilter,
        startDate,
        endDate: now,
        statistics: {
            // total a cobrar
            totalToCollect,
            // total cobrado
            totalCollected,
            // saldo pendiente
            pendingBalance,
            // porcentaje de cobro
            collectionPercentage: totalToCollect > 0 ? ((totalCollected / totalToCollect) * 100).toFixed(2) : '0.00'
        }
    };
};
