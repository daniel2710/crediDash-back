import { ClientSchema } from "../../schemas/clients";

export const findClientById = async (clientId: string, workspaceId: string) => {
    const client = await ClientSchema.findOne({ _id: clientId, workspaceId });
    
    if (!client) {
        throw new Error('Client not found or does not belong to the provided workspace');
    }
    
    return client;
};
