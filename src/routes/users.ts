import { Router } from "express";
import {
    createUserAccount,
    deleteUserAccount,
    getAllUsers,
    getUserById,
    getUserByWorkspace,
    updateUserById
} from "../controllers/users";
import { isAuthenticated } from "../middlewares/isAuthenticated";

export default (router: Router) => {
    router.get('/users', isAuthenticated, getAllUsers);
    router.get('/users/:id', isAuthenticated, getUserById);
    router.get('/users/workspace/:workspaceId', isAuthenticated, getUserByWorkspace);
    router.post('/users/create_account', createUserAccount);
    router.delete('/users/:workspaceId/:userId', isAuthenticated, deleteUserAccount);
    router.patch('/users/:workspaceId/:idUser', isAuthenticated, updateUserById);
}