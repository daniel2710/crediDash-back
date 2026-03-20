import mongoose from "mongoose";
import { UserSchema } from "../../schemas/users";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { ClientSchema } from "../../schemas/clients";
import { LoansSchema } from "../../schemas/loans";

export const deleteUserWithRelatedData = async (userId: string, workspaceId: string) => {
    const user = await UserSchema.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    if (workspace.userId!.toString() !== user._id.toString()) {
        throw new Error('Workspace does not belong to the specified user');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await LoansSchema.deleteMany({ workspaceId }, { session });

        await ClientSchema.deleteMany({ workspaceId }, { session });

        await WorkspaceSchema.findByIdAndDelete(workspaceId, { session });

        await UserSchema.findByIdAndDelete(userId, { session });

        await session.commitTransaction();

        return {
            message: 'User and all related data deleted successfully',
            deletedUser: userId,
            deletedWorkspace: workspaceId
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
