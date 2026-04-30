import { Router } from "express";
import { signIn, validateSession, updatePassword } from "../controllers/auth";

export default (router: Router) => {
    router.post('/signin', signIn);
    router.get('/validate-session', validateSession);
    router.post('/update-password', updatePassword); // Nueva ruta
}