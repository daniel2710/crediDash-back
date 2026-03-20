import { Request, Response } from "express";
import { getUpcomingAndOverdueLoansByUser } from "../../services/loans/getUpcomingAndOverdueLoans.service";
import { validateObjectId } from "../../helpers/validateMongo";
import { UserSchema } from "../../schemas/users";

export const getUpcomingAndOverdueLoans = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { userId } = req.params;
        const daysAhead = parseInt(req.query.daysAhead as string) || 7;

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

        const result = await getUpcomingAndOverdueLoansByUser(userId, daysAhead);

        return res.status(200).json({
            status: "success",
            data: {
                overdueLoans: result.overdueLoans,
                upcomingLoans: result.upcomingLoans,
                summary: result.summary,
                daysAhead
            }
        });

    } catch (error) {
        console.error("Error retrieving upcoming and overdue loans:", error);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch loans';
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
