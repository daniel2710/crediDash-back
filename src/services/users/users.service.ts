import { UserSchema } from "../../schemas/users";
import { WorkspaceSchema } from "../../schemas/workspaces";

export const updateUser = async (idUser: string, workspaceId: string, updateData: any) => {
    const user = await UserSchema.findById(idUser);
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

    const updatedUser = await UserSchema.findByIdAndUpdate(
        idUser,
        updateData,
        { new: true, runValidators: true }
    );

    return updatedUser;
};
