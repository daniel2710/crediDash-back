import { Request, Response, NextFunction } from 'express';
import { UserSchema } from '../schemas/users';
import { authentication, randomToken } from '../helpers';

export const renewTokenIfNeeded = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionToken = req.cookies['CREDIDASH-AUTH'];
        
        if (!sessionToken) {
            return next();
        }

        const user = await UserSchema.findOne({
            'authentication.sessionToken': sessionToken
        }).select('+authentication.tokenExpiresAt +authentication.sessionToken');

        if (!user || !user.authentication?.tokenExpiresAt) {
            return next();
        }

        const now = new Date();
        const expiresAt = new Date(user.authentication.tokenExpiresAt);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // Si el token expira en menos de 1 hora (3600000 ms), renovarlo
        const ONE_HOUR = 60 * 60 * 1000;
        
        if (timeUntilExpiry < ONE_HOUR && timeUntilExpiry > 0) {
            // Generar nuevo token
            const salt = randomToken();
            user.authentication.sessionToken = authentication(salt, user._id.toString());
            user.authentication.tokenExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas
            
            await user.save();

            // Actualizar cookie con el nuevo token
            res.cookie('CREDIDASH-AUTH', user.authentication.sessionToken, {
                sameSite: 'none',
                secure: true,
                maxAge: 8 * 60 * 60 * 1000, // 8 horas
            });

            console.log(`Token renovado para usuario: ${user.email}`);
        }

        return next();
    } catch (error) {
        console.error('Error en renovación de token:', error);
        return next();
    }
};
