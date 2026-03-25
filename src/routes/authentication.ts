import { Router } from "express";
import { signIn, validateSession } from "../controllers/auth";

export default (router: Router) => {
    router.post('/signin', signIn);
    router.get('/validate-session', validateSession);
}
