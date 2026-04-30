import { Request, Response } from 'express';
import { updateUserPassword } from '../../services/users/updatePassword.service';

export const updatePassword = async (req: Request, res: Response) => {
    try {
        const { email, newPassword } = req.body;

        // Validación
        if (!email || !newPassword) {
            return res.status(400).json({
                status: 'failed',
                message: 'Email and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                status: 'failed',
                message: 'Password must be at least 6 characters'
            });
        }

        const result = await updateUserPassword(email, newPassword);

        return res.status(200).json({
            status: 'success',
            message: result.message
        });

    } catch (error) {
        console.error('Update password error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        const statusCode = errorMessage === 'User not found' ? 404 : 500;

        return res.status(statusCode).json({
            status: 'failed',
            message: errorMessage
        });
    }
};