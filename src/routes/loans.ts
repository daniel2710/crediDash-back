import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { createLoan, getAllLoansByClientId, updateLoan } from "../controllers/loans";

export default (router: Router) =>{
    router.get('/loans/:workspaceId/:clientId', isAuthenticated, getAllLoansByClientId);
    router.patch('/loans/:workspaceId/:loanId', isAuthenticated, updateLoan);
    router.post('/loans', isAuthenticated, createLoan);
}   