export interface ISortPaging {
    sort: Record<string, "ASC" | "DESC">;
    skip: number;
    limit: number;
    
  }
  export interface IOrderSortPaging {
    sort: Record<string, "ASC" | "DESC">;
    skip: number;
    limit: number;
    status:string;
  }
  export function getSortPaging(query: any): ISortPaging {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    let sort: Record<string, "ASC" | "DESC"> = { createdAt: "DESC" };
  
    if (query?.sort && query.order) {
      sort = { [query.sort]: query.order.toUpperCase() as "ASC" | "DESC" };
    }
  
    return {
      sort,
      skip: (page - 1) * limit,
      limit,
      
    };
  }
  
  export function getOrderSortPaging(query: any): IOrderSortPaging {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
  
    let sort: Record<string, "ASC" | "DESC"> = { createdAt: "DESC" };
    if (query?.sort && query.order) {
      sort = { [query.sort]: query.order.toUpperCase() as "ASC" | "DESC" };
    }
  
    // Extract the status filter, if provided
    const status = query.status || null;
  
    return {
      sort,
      skip: (page - 1) * limit,
      limit,
      status, // Include status in the return object
    };
  }
  