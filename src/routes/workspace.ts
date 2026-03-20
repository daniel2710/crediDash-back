import { Router } from "express";
import {
    getAllWorkspaces,
    getWorkspaceById
} from "../controllers/workspace";
import { isAuthenticated } from "../middlewares/isAuthenticated";

export default (router: Router) => {
    router.get('/workspaces', isAuthenticated, getAllWorkspaces);
    router.get('/workspaces/:id', isAuthenticated, getWorkspaceById);
}
