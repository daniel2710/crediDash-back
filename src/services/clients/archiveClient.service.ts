import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";

export const toggleArchiveClient = async (clientId: string, workspaceId: string) => {
    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const client = await ClientSchema.findById(clientId);
    if (!client) {
        throw new Error('Client not found');
    }

    if (client.workspaceId!.toString() !== workspaceId) {
        throw new Error('The client does not belong to the specified workspace');
    }

    client.isArchived = !client.isArchived;
    await client.save();

    return client;
};
