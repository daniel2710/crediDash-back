import { URL_BASE } from "..";

export const buildPaginationUrls = (
    path: string,
    currentPage: number,
    totalItems: number,
    limit: number
) => {
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (currentPage - 1) * limit;
    const hasNext = skip + limit < totalItems;
    const hasPrevious = currentPage > 1;

    return {
        next: hasNext ? `${URL_BASE}/${path}?page=${currentPage + 1}` : null,
        previous: hasPrevious ? `${URL_BASE}/${path}?page=${currentPage - 1}` : null,
        totalPages,
    };
};
