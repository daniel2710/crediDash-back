import { Request, Response } from "express";
import { createClientWithWorkspace } from "../../services/clients/createClient.service";

export const createClient = async (req: Request, res: Response) => {
    try {
        const { workspaceId, userId, name, lastname, email, phone, address, description } = req.body;

        // Verificar campos obligatorios
        if (!workspaceId || !userId || !name || !lastname) {
            return res.status(400).json({
                status: "failed",
                message: "workspaceId, userId, name, and lastname are required.",
            });
        }

        const client = await createClientWithWorkspace({
            workspaceId,
            userId,
            name,
            lastname,
            email,
            phone,
            address,
            description,
        });

        return res.status(201).json({
            status: "success",
            message: "Client created successfully.",
            client,
        });
    } catch (error) {
        console.error("Error creating client:", error);
        
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        let statusCode = 500;

        if (errorMessage === 'Workspace not found') statusCode = 404;
        else if (errorMessage === 'This workspace does not belong to the user') statusCode = 403;
        else if (errorMessage === 'A client with the same exact data already exists') statusCode = 400;

        return res.status(statusCode).json({
            status: "failed",
            message: errorMessage,
        });
    }
};