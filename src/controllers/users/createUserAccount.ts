import { Request, Response } from "express";
import { ZodError } from "zod";
import { createUserWithWorkspace } from "../../services/users/createUserAccount.service";
import { createUserSchema } from "../../schemas/validations/createUserValidation";

export const createUserAccount = async (req: Request, res: Response): Promise<Response> => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        
        const result = await createUserWithWorkspace(validatedData);
  
        return res.status(201).json({
            status: 'success',
            message: 'User and workspace created successfully',
            user: result.user,
            workspace: result.workspace,
        });
    } catch (error) {
        console.error('Error creating account:', error);
  
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

        if (errorMessage === 'User with this email already exists') statusCode = 400;
        else if (errorMessage === 'Cannot create superadmin users manually') statusCode = 403;
  
        return res.status(statusCode).json({
            status: 'failed',
            message: errorMessage,
        });
    }
  };