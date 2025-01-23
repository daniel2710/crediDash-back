import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
    createLoan,
    getAllLoansByClient,
    getAllLoansByWorkspace,
    updateLoanById,
    payLoanAsLiquidated
} from "../controllers/loans";

export default (router: Router) =>{
    router.get('/loans/:workspaceId/:clientId', isAuthenticated, getAllLoansByClient);
    router.get('/loans/workspace/:workspaceId/:userId', isAuthenticated, getAllLoansByWorkspace);
    router.post('/loans', isAuthenticated, createLoan);
    router.post('/loans/liquidate', isAuthenticated, payLoanAsLiquidated);
    router.patch('/loans/:workspaceId/:loanId', isAuthenticated, updateLoanById);
}   