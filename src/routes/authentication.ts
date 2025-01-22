import { Router } from "express";
import { sign_in } from "../controllers/authentication";

export default (router: Router) => {
    router.post('/signin', sign_in);
}
