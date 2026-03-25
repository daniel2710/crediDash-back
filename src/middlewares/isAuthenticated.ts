import { Request, Response, NextFunction } from 'express'
import { merge } from 'lodash' 
import { UserSchema } from '../schemas/users'
import { authentication, randomToken } from '../helpers'

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) =>{
    try {
        const sessionToken = req.cookies['CREDIDASH-AUTH'] 
        if(!sessionToken){
            console.log("No session token")
            return res.sendStatus(401)
        }

        const existingUser = await UserSchema.findOne({
            'authentication.sessionToken': sessionToken
        }).select('+authentication.tokenExpiresAt +authentication.sessionToken')

        if(!existingUser){
            console.log("No user exists")
            return res.sendStatus(401)
        }

        // Verificar si el token ha expirado
        if (existingUser.authentication?.tokenExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(existingUser.authentication.tokenExpiresAt);
            
            // Si el token ya expiró, rechazar la solicitud
            if (expiresAt < now) {
                console.log("Token expired");
                return res.status(401).json({
                    status: 'failed',
                    message: 'Session expired. Please login again.'
                });
            }
            
            // Si el token expira en menos de 1 hora, renovarlo automáticamente
            const timeUntilExpiry = expiresAt.getTime() - now.getTime();
            const ONE_HOUR = 60 * 60 * 1000;
            
            if (timeUntilExpiry < ONE_HOUR) {
                const salt = randomToken();
                existingUser.authentication.sessionToken = authentication(salt, existingUser._id.toString());
                existingUser.authentication.tokenExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
                
                await existingUser.save();

                // Actualizar cookie con el nuevo token
                res.cookie('CREDIDASH-AUTH', existingUser.authentication.sessionToken, {
                    sameSite: 'none',
                    secure: true,
                    maxAge: 8 * 60 * 60 * 1000,
                });

                console.log(`Token renovado automáticamente para usuario: ${existingUser.email}`);
            }
        }

        merge(req, { identity: existingUser })
        return next()
    } catch (error) {
        console.log("error credidash: ", error);
        return res.sendStatus(500)
    }
}