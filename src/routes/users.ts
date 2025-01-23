import { Router } from "express";
import {
    create_account,
    getAllUsers,
    getUserById,
    getUserByWorkspace,
    updateUserById
} from "../controllers/users";
import { isAuthenticated } from "../middlewares/isAuthenticated";

export default (router: Router) =>{
    router.post('/create_account', create_account);
    router.get('/users', isAuthenticated, getAllUsers);
    router.get('/users/:id', isAuthenticated, getUserById);
    router.get('/users/info/:workspaceId', isAuthenticated, getUserByWorkspace);
    router.patch('/users/:workspaceId/:idUser', isAuthenticated, updateUserById);
}   