import { Router } from 'express'
import users from './users'
import authentication from './authentication';

const routes = Router();

export default (): Router =>{
    authentication(routes)
    users(routes)
    return routes
}