import { Request, Response } from "express";
import { getProgressStatistics } from "../../services/statistics/getProgress.service";
import { validateObjectId } from "../../helpers/validateMongo";
import { UserSchema } from "../../schemas/users";

export const getProgress = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { userId } = req.params;
        const timeFilter = (req.query.filter as string) || 'month';

        // Validar que el filtro sea válido
        if (timeFilter !== 'week' && timeFilter !== 'month') {
            return res.status(400).json({
                status: 'failed',
                message: 'Invalid filter. Use "week" or "month"'
            });
        }

        // Validar el userId
        const userIdError = validateObjectId(userId, "userId", res);
        if (userIdError) return userIdError;

        // Verificar si el usuario existe
        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "failed",
                message: "User not found",
            });
        }

        const result = await getProgressStatistics(userId, timeFilter as 'week' | 'month');

        return res.status(200).json({
            status: "success",
            data: result
        });

    } catch (error) {
        console.error("Error retrieving progress statistics:", error);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics';
        let statusCode = 500;

        if (errorMessage === 'No workspaces found for this user') {
            statusCode = 404;
        }

        return res.status(statusCode).json({
            status: "failed",
            message: errorMessage,
        });
    }
};
