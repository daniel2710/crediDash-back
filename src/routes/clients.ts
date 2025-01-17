import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { createClient, deleteClient } from "../controllers/clients";

export default (router: Router) =>{
    router.post('/clients/create', isAuthenticated, createClient);
    router.delete('/clients/delete/:clientId/:userId', isAuthenticated, deleteClient);
}   