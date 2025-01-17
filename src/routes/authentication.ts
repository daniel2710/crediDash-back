import { Router } from "express";
import { create_account, sign_in } from "../controllers/authentication";

export default (router: Router) => {
    router.post('/signin', sign_in);
    router.post('/create_account', create_account);
}
