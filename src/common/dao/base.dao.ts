// May be used in the future for common DAO methods
import { PaginatedResult } from '@/src/utilities/paginatedResponse';
export abstract class BaseDao<T, ID> {

    // Find all entities with pagination
    abstract findAll(
        page: number,
        limit: number,
    ): Promise<PaginatedResult<T>>;

    // Get entity by ID
    abstract getById(id: ID): Promise<T | null>;

    // Create a new entity
    abstract create(entity: T): Promise<T>;

    // Update an existing entity
    abstract update(id: ID, entity: Partial<T>): Promise<T>;

    // Delete an entity by ID
    abstract delete(id: ID): Promise<void>;
}
