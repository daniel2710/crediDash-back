import mongoose from "mongoose";
import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { LoansSchema } from "../../schemas/loans";

export const deleteClientById = async (clientId: string, userId: string) => {
    const client = await ClientSchema.findById(clientId);
    if (!client) {
        throw new Error('Client not found');
    }

    const workspace = await WorkspaceSchema.findById(client.workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    if (!workspace.userId!.equals(new mongoose.Types.ObjectId(userId))) {
        throw new Error('This workspace does not belong to this user');
    }

    // Eliminar todos los préstamos asociados al cliente
    await LoansSchema.deleteMany({ clientId: clientId });

    await ClientSchema.findByIdAndDelete(clientId);

    return client;
};
