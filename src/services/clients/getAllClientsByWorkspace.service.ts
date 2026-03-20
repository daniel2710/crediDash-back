import { ClientSchema } from "../../schemas/clients";
import { WorkspaceSchema } from "../../schemas/workspaces";
import { buildPaginationUrls } from "../../helpers/buildPaginationUrls";

export const findAllClientsByWorkspace = async (workspaceId: string, currentPage: number, limit: number) => {
    const workspace = await WorkspaceSchema.findById(workspaceId);
    if (!workspace) {
        throw new Error('Workspace not found');
    }

    const skip = (currentPage - 1) * limit;

    const [clients, totalItems] = await Promise.all([
        ClientSchema.find({ workspaceId }).skip(skip).limit(limit),
        ClientSchema.countDocuments({ workspaceId })
    ]);

    if (clients.length === 0 && currentPage !== 1) {
        throw new Error('There are no results on the current page.');
    }

    const pagination = buildPaginationUrls(`clients/workspace/${workspaceId}`, currentPage, totalItems, limit);

    return {
        clients,
        current_page: currentPage,
        total_pages: pagination.totalPages,
        next: pagination.next,
        previous: pagination.previous,
        total_items: totalItems,
        items_on_page: clients.length,
    };
};
