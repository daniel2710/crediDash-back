import { UserSchema } from "../../schemas/users";

export const findUserByWorkspace = async (workspaceId: string) => {
    const user = await UserSchema.findOne({ workspaceId }).populate('workspaceId');
    
    if (!user) {
        throw new Error('User not found');
    }
    
    return user;
};
