import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import {
    createClient,
    deleteClient,
    getAllClientsByWorkspace,
    getClientById,
    updateClientById,
    archiveClient
} from "../controllers/clients";

export default (router: Router) =>{
    router.get('/clients/:workspaceId', isAuthenticated, getAllClientsByWorkspace);
    router.get('/clients/:workspaceId/:clientId', isAuthenticated, getClientById);
    router.post('/clients/create', isAuthenticated, createClient);
    router.patch('/clients/:workspaceId/:clientId', isAuthenticated, updateClientById);
    router.patch('/clients/:workspaceId/:clientId/archive', isAuthenticated, archiveClient);
    router.delete('/clients/delete/:clientId/:userId', isAuthenticated, deleteClient);
}   