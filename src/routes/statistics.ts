import { Router } from "express";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { getProgress } from "../controllers/statistics";

export default (router: Router) => {
    router.get('/statistics/progress/:userId', isAuthenticated, getProgress);
}
