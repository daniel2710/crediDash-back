import { Request, Response } from 'express';
import { UserSchema } from '../../schemas/users';
import { authentication, randomToken } from '../../helpers';

export const getUserByEmail = (email: string) =>{
    return UserSchema.findOne({ email })
}

export const signIn = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validación básica de entrada
        if (!email || !password) {
            const missingField = !email ? 'email' : 'password';
            return res.status(400).json({ 
                status: 'failed', 
                message: `${missingField} is required` 
            });
        }

        const normalizedEmail = email.toLowerCase();
        
        // Obtener el usuario y verificar credenciales
        const user = await getUserByEmail(normalizedEmail).select('+authentication.salt +authentication.password');
        if (!user) {
            return res.status(400).json({ 
                status: 'failed', 
                message: 'User does not exist' 
            });
        }

        const { authentication: auth } = user;
        if (!auth || authentication(auth.salt, password) !== auth.password) {
            return res.status(400).json({ 
                status: 'failed', 
                message: 'Incorrect email or password' 
            });
        }

        // Generar token de sesión
        const salt = randomToken();
        auth.sessionToken = authentication(salt, user._id.toString());

        await user.save();

        // Configuración de cookie de autenticación
        res.cookie('CREDIDASH-AUTH', auth.sessionToken, {
            sameSite: 'none',
            secure: true,
        });

        return res.status(200).json({ 
            status: 'success', 
            user 
        });

    } catch (error) {
        console.error('Sign-in error:', error);
        return res.status(500).json({ 
            status: 'failed', 
            message: 'An unexpected error occurred' 
        });
    }
};