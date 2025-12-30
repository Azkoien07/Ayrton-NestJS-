import { Args, Mutation, Query, Resolver, Int, ID } from '@nestjs/graphql';
import { Role } from '../models/role.model';
import { RolePage, RoleSingle } from '../models/role.page';
import { RolesService } from '../services/roles.service';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { CreateRoleInput } from '../dto/createRole.input';
import { roleEntity } from '../entity/role.entity';
import { ApiResponse } from '@/src/common/http/response';


@Resolver(() => Role)
export class RolesResolver {

    constructor(private readonly rolesService: RolesService) { }

    // 1. Get all roles with pagination
    @Query(() => RolePage)
    async roles(
        @Args('page', { type: () => Int }) page: number,
        @Args('limit', { type: () => Int }) limit: number
    ): Promise<RolePage> {
        const response = await this.rolesService.findAll(page, limit);

        if (response.data.length === 0) {
            return {
                code: 404,
                message: 'No roles found',
                data: [],
            };
        }

        return {
            code: 200,
            message: 'Roles retrieved successfully',
            data: response.data,
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages,
        };
    }

    // 2. Get role by ID
    @Query(() => RoleSingle)
    async role(@Args('id', { type: () => ID }) id: number): Promise<RoleSingle> {
        try {
            const roleData = await this.rolesService.getById(id);
            return {
                code: 200,
                message: 'Role retrieved successfully',
                data: roleData,
            };
        } catch (error) {
            return {
                code: 404,
                message: 'Role not found',
            };
        }
    }

    // 3. Create a new role
    @Mutation(() => ApiResponse)
    async createRole(@Args('input') input: CreateRoleInput): Promise<ApiResponse> {
        const role = new roleEntity();
        role.name = input.name;
        role.description = input.description || "N/A";
        await this.rolesService.create(role);
        return ResponseFactory.success('Role created successfully');
    }

    // 4. Update an existing role
    @Mutation(() => ApiResponse)
    async updateRole(
        @Args('id', { type: () => ID }) id: number,
        @Args('input') input: CreateRoleInput
    ): Promise<ApiResponse<Role>> {
        try {
            const updatedRole = await this.rolesService.update(id, input);
            return ResponseFactory.success('Role updated successfully', updatedRole,);
        } catch {
            return ResponseFactory.notFound('Role not found');
        }
    }

    // 5. Delete a role by ID
    @Mutation(() => ApiResponse)
    async deleteRole(@Args('id', { type: () => ID }) id: number): Promise<ApiResponse> {
        try {
            await this.rolesService.delete(id);
            return ResponseFactory.success('Role deleted successfully');
        } catch (error) {
            return ResponseFactory.notFound('Role not found');
        }
    }
}