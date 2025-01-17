import { Router } from "express";
import { getAllUsers } from "../controllers/user";
import { isAuthenticated } from "../middlewares/isAuthenticated";

export default (router: Router) =>{
    router.get('/users', isAuthenticated, getAllUsers);

}   