import { URL_BASE } from "..";

export const paginate = (items: any[], currentPage: number, limit: number, patch: string) => {
    let hasNextPage 
    let hasPreviousPage
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const results = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / limit)
    const totalItems = items.length

    hasNextPage = endIndex < items.length;
    hasPreviousPage = startIndex > 0;
  
    if(hasNextPage){
        hasNextPage = URL_BASE+`/${patch}/`+'?page='+((currentPage)+1)
    }else{
        hasNextPage = null
    }

    if(hasPreviousPage){
        hasPreviousPage = URL_BASE+`/${patch}/`+'?page='+((currentPage)-1)
    }else{
        hasPreviousPage = null
    }
  
    return {
      results,
      hasNextPage,
      hasPreviousPage,
      totalPages,
      totalItems
    };
}
  