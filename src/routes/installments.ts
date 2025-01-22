import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { payInstallment } from "../controllers/installments";

export default (router: Router) =>{
    router.post('/installments/create', isAuthenticated, payInstallment);
}   