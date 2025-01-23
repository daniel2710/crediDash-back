import { Router } from "express";
import { signIn } from "../controllers/auth";

export default (router: Router) => {
    router.post('/signin', signIn);
}
