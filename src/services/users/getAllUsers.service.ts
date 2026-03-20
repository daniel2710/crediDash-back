import { UserSchema } from "../../schemas/users";
import { buildPaginationUrls } from "../../helpers/buildPaginationUrls";

export const findAllUsers = async (currentPage: number, limit: number) => {
    const skip = (currentPage - 1) * limit;

    const [users, totalItems] = await Promise.all([
        UserSchema.find().skip(skip).limit(limit),
        UserSchema.countDocuments()
    ]);

    if (users.length === 0 && currentPage !== 1) {
        throw new Error('There are no results on the current page.');
    }

    const pagination = buildPaginationUrls('users', currentPage, totalItems, limit);

    return {
        users,
        current_page: currentPage,
        total_pages: pagination.totalPages,
        next: pagination.next,
        previous: pagination.previous,
        total_items: totalItems,
        items_on_page: users.length,
    };
};