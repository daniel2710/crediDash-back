import { Request, Response } from "express";
import { ZodError } from "zod";
import { deleteUserSchema } from "../../schemas/validations/deleteUserValidation";
import { deleteUserWithRelatedData } from "../../services/users/deleteUserAccount.service";

export const deleteUserAccount = async (req: Request, res: Response): Promise<Response> => {
    try {
        const validatedData = deleteUserSchema.parse(req.params);
        
        const result = await deleteUserWithRelatedData(validatedData.userId, validatedData.workspaceId);
  
        return res.status(200).json({
            status: 'success',
            message: result.message,
            deletedUser: result.deletedUser,
            deletedWorkspace: result.deletedWorkspace
        });
    } catch (error) {
        console.error('Error deleting user account:', error);
  
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: 'failed',
                message: 'Validation error',
                errors: error.issues.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        let statusCode = 500;

        if (errorMessage === 'User not found') statusCode = 404;
        else if (errorMessage === 'Workspace not found') statusCode = 404;
        else if (errorMessage === 'Workspace does not belong to the specified user') statusCode = 403;
  
        return res.status(statusCode).json({
            status: 'failed',
            message: errorMessage,
        });
    }
};
