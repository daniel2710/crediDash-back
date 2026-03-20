import { WorkspaceSchema } from "../../schemas/workspaces";
import { buildPaginationUrls } from "../../helpers/buildPaginationUrls";

export const findAllWorkspaces = async (currentPage: number, limit: number) => {
    const skip = (currentPage - 1) * limit;

    const [workspaces, totalItems] = await Promise.all([
        WorkspaceSchema.find().skip(skip).limit(limit).populate('userId'),
        WorkspaceSchema.countDocuments()
    ]);

    if (workspaces.length === 0 && currentPage !== 1) {
        throw new Error('There are no results on the current page.');
    }

    const pagination = buildPaginationUrls('workspaces', currentPage, totalItems, limit);

    return {
        workspaces,
        current_page: currentPage,
        total_pages: pagination.totalPages,
        next: pagination.next,
        previous: pagination.previous,
        total_items: totalItems,
        items_on_page: workspaces.length,
    };
};
