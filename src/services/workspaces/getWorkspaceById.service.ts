import { WorkspaceSchema } from "../../schemas/workspaces";

export const findWorkspaceById = async (id: string) => {
    const workspace = await WorkspaceSchema.findById({ _id: id }).populate('userId');
    
    if (!workspace) {
        throw new Error('Workspace not found');
    }
    
    return workspace;
};
