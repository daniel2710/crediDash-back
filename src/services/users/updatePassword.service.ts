import { UserSchema } from "../../schemas/users";
import { authentication, randomToken } from "../../helpers";

export const updateUserPassword = async (email: string, newPassword: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await UserSchema.findOne({ email: normalizedEmail });
    if (!user) {
        throw new Error('User not found');
    }

    // Generar nuevo salt y hashear contraseña con la SECRET_KEY actual
    const salt = randomToken();
    const hashedPassword = authentication(salt, newPassword);

    // Actualizar campos de autenticación
    user.authentication = {
        password: hashedPassword,
        salt,
        sessionToken: undefined,
        tokenExpiresAt: undefined
    };

    await user.save();

    return {
        message: 'Password updated successfully',
        email: user.email
    };
};