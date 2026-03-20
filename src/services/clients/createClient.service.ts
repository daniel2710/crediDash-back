import mongoose from "mongoose";
import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";

export const createClientWithWorkspace = async (clientData: {
    workspaceId: string;
    userId: string;
    name: string;
    lastname: string;
    email?: string;
    phone?: string;
    address?: string;
    description?: string;
}) => {
    const { workspaceId, userId, name, lastname, email, phone, address, description } = clientData;

    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    if (!workspace.userId!.equals(new mongoose.Types.ObjectId(userId))) {
        throw new Error('This workspace does not belong to the user');
    }

    const duplicateClient = await ClientSchema.findOne({
        workspaceId,
        name,
        lastname,
        email,
        phone,
        address,
        description,
    });

    if (duplicateClient) {
        throw new Error('A client with the same exact data already exists');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const newClient = new ClientSchema({
            workspaceId,
            name,
            lastname,
            email,
            phone,
            address,
            description,
        });

        const savedClient = await newClient.save({ session });

        await WorkspaceSchema.findByIdAndUpdate(
            workspaceId,
            { $inc: { "stats.total_clients": 1 } },
            { session }
        );

        await session.commitTransaction();

        return savedClient;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
