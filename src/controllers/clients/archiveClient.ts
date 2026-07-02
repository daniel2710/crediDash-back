import { Request, Response } from "express";
import { validateObjectId } from "../../helpers/validateMongo";
import { toggleArchiveClient } from "../../services/clients/archiveClient.service";

export const archiveClient = async (req: Request, res: Response) => {
    try {
        const { workspaceId, clientId } = req.params;

        const workspaceError = validateObjectId(workspaceId, 'workspaceId', res);
        if (workspaceError) return workspaceError;

        const clientError = validateObjectId(clientId, 'clientId', res);
        if (clientError) return clientError;

        const client = await toggleArchiveClient(clientId, workspaceId);

        return res.status(200).json({
            status: 'success',
            message: client.isArchived ? 'Client archived successfully' : 'Client unarchived successfully',
            client,
        });
    } catch (error) {
        console.error("Error archiving client:", error);

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        let statusCode = 500;

        if (errorMessage === 'Client not found') statusCode = 404;
        else if (errorMessage === 'Workspace not found') statusCode = 404;
        else if (errorMessage === 'The client does not belong to the specified workspace') statusCode = 403;

        return res.status(statusCode).json({
            status: 'failed',
            message: errorMessage,
        });
    }
};
