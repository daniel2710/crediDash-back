import { LoansSchema } from "../../schemas/loans";
import { WorkspaceSchema } from "../../schemas/workspaces";

export const getUpcomingAndOverdueLoansByUser = async (userId: string, daysAhead: number = 7) => {
    // Obtener todos los workspaces del usuario
    const workspaces = await WorkspaceSchema.find({ userId });
    
    if (!workspaces || workspaces.length === 0) {
        throw new Error('No workspaces found for this user');
    }

    const workspaceIds = workspaces.map(ws => ws._id);
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    // Obtener todos los préstamos de los workspaces del usuario que no están liquidados
    const loans = await LoansSchema.find({
        workspaceId: { $in: workspaceIds },
        status: { $ne: 'liquidated' }
    }).populate('clientId', 'name lastname email phone');

    const overdueLoans: any[] = [];
    const upcomingLoans: any[] = [];

    loans.forEach(loan => {
        let hasOverdueInstallments = false;
        let hasUpcomingInstallments = false;
        const overdueInstallments: any[] = [];
        const upcomingInstallments: any[] = [];

        loan.installments.forEach((installment, index) => {
            const endDate = new Date(installment.end_date);
            
            // Cuotas vencidas (end_date ya pasó y no están liquidadas)
            if (installment.status !== 'liquidated' && endDate < now) {
                hasOverdueInstallments = true;
                overdueInstallments.push({
                    installmentNumber: index + 1,
                    amount: installment.amount,
                    payment: installment.payment,
                    status: installment.status,
                    end_date: installment.end_date,
                    daysOverdue: Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
                });
            }
            
            // Cuotas próximas a vencer (end_date está entre hoy y los próximos X días)
            if (installment.status !== 'liquidated' && endDate >= now && endDate <= futureDate) {
                hasUpcomingInstallments = true;
                upcomingInstallments.push({
                    installmentNumber: index + 1,
                    amount: installment.amount,
                    payment: installment.payment,
                    status: installment.status,
                    end_date: installment.end_date,
                    daysUntilDue: Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                });
            }
        });

        if (hasOverdueInstallments) {
            overdueLoans.push({
                loanId: loan._id,
                workspaceId: loan.workspaceId,
                client: loan.clientId,
                description: loan.description,
                amount: loan.amount,
                payment_missing: loan.payment_missing,
                status: loan.status,
                overdueInstallments
            });
        }

        if (hasUpcomingInstallments) {
            upcomingLoans.push({
                loanId: loan._id,
                workspaceId: loan.workspaceId,
                client: loan.clientId,
                description: loan.description,
                amount: loan.amount,
                payment_missing: loan.payment_missing,
                status: loan.status,
                upcomingInstallments
            });
        }
    });

    return {
        overdueLoans,
        upcomingLoans,
        summary: {
            totalOverdueLoans: overdueLoans.length,
            totalUpcomingLoans: upcomingLoans.length,
            totalOverdueInstallments: overdueLoans.reduce((sum, loan) => sum + loan.overdueInstallments.length, 0),
            totalUpcomingInstallments: upcomingLoans.reduce((sum, loan) => sum + loan.upcomingInstallments.length, 0)
        }
    };
};
