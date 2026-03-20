import { URL_BASE } from "..";

export const paginate = (items: any[], currentPage: number, limit: number, patch: string) => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const results = items.slice(startIndex, endIndex);

    const hasNext = endIndex < totalItems;
    const hasPrevious = startIndex > 0;

    const hasNextPage = hasNext ? `${URL_BASE}/${patch}?page=${currentPage + 1}` : null;
    const hasPreviousPage = hasPrevious ? `${URL_BASE}/${patch}?page=${currentPage - 1}` : null;
  
    return {
        results,
        hasNextPage,
        hasPreviousPage,
        totalPages,
        totalItems
    };
}