declare namespace Express {
    export interface Request {
        user: {
            id: number;
            level: number;
        }
    }
}

declare namespace ServiceOptions {
    interface FindManyOptions {
        limit?: number;
        page?: number;
    }
    
    interface FindManyResult<T> {
        items: T[];
        totalCount: number;
    }
}
