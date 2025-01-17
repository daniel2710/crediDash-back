import { Request, Response, NextFunction } from 'express'
import { merge } from 'lodash'
import { getUserBySessionToken } from '../methods/user' 

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) =>{
    try {
        const sessionToken = req.cookies['CREDIDASH-AUTH'] 
        if(!sessionToken){
            console.log("No session token")
            return res.sendStatus(403)
        }

        const existingUser = await getUserBySessionToken(sessionToken)
        if(!existingUser){
            console.log("No user exists")
            return res.sendStatus(403)
        }

        merge(req, { identity: existingUser })
        return next()
    } catch (error) {
        console.log("error credidash: ", error);
        return res.sendStatus(500)
    }
}