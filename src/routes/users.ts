import { Router } from "express";
import { getAllUsers, getUserByIdController, getUserByWorkspaceId, updateUserById } from "../controllers/user";
import { isAuthenticated } from "../middlewares/isAuthenticated";

export default (router: Router) =>{
    router.get('/users', isAuthenticated, getAllUsers);
    router.get('/users/:id', isAuthenticated, getUserByIdController);
    router.get('/users/info/:workspaceId', isAuthenticated, getUserByWorkspaceId);
    router.patch('/users/:workspaceId/:idUser', isAuthenticated, updateUserById);
}   