import { Request, Response } from 'express';
import { UserSchema } from '../../schemas/users';

export const validateSession = async (req: Request, res: Response): Promise<Response> => {
    try {
        const sessionToken = req.cookies['CREDIDASH-AUTH'];
        
        if (!sessionToken) {
            return res.status(403).json({
                status: 'failed',
                valid: false
            });
        }

        const user = await UserSchema.findOne({
            'authentication.sessionToken': sessionToken
        }).select('+authentication.tokenExpiresAt');

        if (!user) {
            return res.status(403).json({
                status: 'failed',
                valid: false
            });
        }

        // Verificar si el token ha expirado
        if (user.authentication?.tokenExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(user.authentication.tokenExpiresAt);
            
            if (expiresAt < now) {
                return res.status(403).json({
                    status: 'failed',
                    valid: false
                });
            }
        }

        return res.status(200).json({
            status: 'success',
            valid: true
        });

    } catch (error) {
        console.error('Validate session error:', error);
        return res.status(403).json({
            status: 'failed',
            valid: false
        });
    }
};
