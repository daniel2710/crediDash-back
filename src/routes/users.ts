import { Router } from "express";
import { getAllUsers, getUserByIdController, getUserByWorkspaceId } from "../controllers/user";
import { isAuthenticated } from "../middlewares/isAuthenticated";

export default (router: Router) =>{
    router.get('/users', isAuthenticated, getAllUsers);
    router.get('/users/:id', isAuthenticated, getUserByIdController);
    router.get('/users/info/:workspaceId', isAuthenticated, getUserByWorkspaceId);
}   