import { Router } from 'express'
import users from './users'
import authentication from './authentication';
import clients from './clients';

const routes = Router();

export default (): Router =>{
    authentication(routes)
    users(routes)
    clients(routes)
    return routes
}