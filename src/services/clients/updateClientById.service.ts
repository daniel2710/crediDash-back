import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";

export const updateClientById = async (clientId: string, workspaceId: string, updateData: any) => {
    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const client = await ClientSchema.findById(clientId);
    if (!client) {
        throw new Error('Client not found');
    }

    if (client.workspaceId!.toString() !== workspaceId) {
        throw new Error('Client does not belong to the provided workspace');
    }

    const updatedClient = await ClientSchema.findByIdAndUpdate(
        clientId,
        updateData,
        { new: true, runValidators: true }
    );

    return updatedClient;
};
