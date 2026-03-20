import { LoansSchema } from "../schemas/loans";

/**
 * Verifica y actualiza el estado de las cuotas y préstamos atrasados
 * Una cuota está atrasada si su end_date ha pasado y no está liquidada
 * Un préstamo está atrasado si tiene al menos una cuota atrasada
 */
export const checkAndUpdateLateStatus = async (loanId: string) => {
    const loan = await LoansSchema.findById(loanId);
    
    if (!loan || loan.status === 'liquidated') {
        return loan;
    }

    const now = new Date();
    let hasLateInstallments = false;

    // Actualizar el estado de cada cuota
    loan.installments.forEach((installment) => {
        // Si la cuota no está liquidada y su fecha de vencimiento ya pasó
        if (installment.status !== 'liquidated' && installment.end_date < now) {
            installment.status = 'late';
            hasLateInstallments = true;
        }
    });

    // Actualizar el estado del préstamo
    if (hasLateInstallments) {
        loan.status = 'late';
    } else if (loan.payment_missing <= 0) {
        loan.status = 'liquidated';
    } else if (loan.payment_actual > 0) {
        loan.status = 'partial';
    } else {
        loan.status = 'pending';
    }

    await loan.save();
    return loan;
};

/**
 * Verifica y actualiza el estado de todos los préstamos de un workspace
 */
export const checkAndUpdateAllLateLoans = async (workspaceId: string) => {
    const loans = await LoansSchema.find({ 
        workspaceId, 
        status: { $ne: 'liquidated' } 
    });

    const now = new Date();
    const updatePromises = [];

    for (const loan of loans) {
        let hasLateInstallments = false;
        let modified = false;

        loan.installments.forEach((installment) => {
            if (installment.status !== 'liquidated' && installment.end_date < now) {
                if (installment.status !== 'late') {
                    installment.status = 'late';
                    modified = true;
                }
                hasLateInstallments = true;
            }
        });

        if (hasLateInstallments && loan.status !== 'late') {
            loan.status = 'late';
            modified = true;
        }

        if (modified) {
            updatePromises.push(loan.save());
        }
    }

    await Promise.all(updatePromises);
    return loans;
};
