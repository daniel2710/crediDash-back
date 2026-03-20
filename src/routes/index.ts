import { Router } from 'express'
import users from './users'
import authentication from './authentication';
import clients from './clients';
import loans from './loans';
import installments from './installments';
import workspace from './workspace';

const routes = Router();

export default (): Router =>{
    authentication(routes)
    users(routes)
    clients(routes)
    loans(routes)
    installments(routes)
    workspace(routes)
    return routes
}