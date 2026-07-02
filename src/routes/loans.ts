import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
    createLoan,
    getAllLoansByClient,
    getAllLoansByWorkspace,
    updateLoanById,
    payLoanAsLiquidated,
    getUpcomingAndOverdueLoans,
    deleteLoanById,
    getLoanById
} from "../controllers/loans";

export default (router: Router) =>{
    router.get('/loans/:workspaceId/:clientId', isAuthenticated, getAllLoansByClient);
    router.get('/loans/workspace/:workspaceId/:userId', isAuthenticated, getAllLoansByWorkspace);
    router.get('/loans/upcoming-and-overdue/:userId', isAuthenticated, getUpcomingAndOverdueLoans);
    router.get('/loans/detail/:workspaceId/:loanId', isAuthenticated, getLoanById);
    router.post('/loans', isAuthenticated, createLoan);
    router.post('/loans/liquidate', isAuthenticated, payLoanAsLiquidated);
    router.patch('/loans/:workspaceId/:loanId', isAuthenticated, updateLoanById);
    router.delete('/loans/:workspaceId/:loanId', isAuthenticated, deleteLoanById);
}   