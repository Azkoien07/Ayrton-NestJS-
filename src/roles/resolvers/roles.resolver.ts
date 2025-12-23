import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from '../models/role.model';
import { RolesService } from '../services/roles.service';
import { RolesResponse, RoleResponse } from '../models/role.response';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { CreateRoleInput } from '../dto/createRole.input';
import { roleEntity } from '../entity/role.entity';
import { ApiResponse } from '@/src/common/http/response';


@Resolver(() => Role)
export class RolesResolver {

    constructor(private readonly rolesService: RolesService) { }

    // 1. Get all roles with pagination
    @Query(() => RolesResponse) async roles(@Args('page',) page: number, @Args('limit',) limit: number,): Promise<RolesResponse> {
        const rolesData = await this.rolesService.findAll(page, limit);

        if (rolesData.length === 0) {
            const response = ResponseFactory.notFound('No roles found');
            return {
                code: response.code,
                message: response.message,
                roles: []
            };
        }

        return {
            code: 200,
            message: 'Roles retrieved successfully',
            roles: rolesData
        };
    }

    // 2. Get role by ID
    @Query(() => RoleResponse) async role(@Args('id') id: number,
    ): Promise<RoleResponse> {
        try {
            const roleData = await this.rolesService.getById(id);
            const response = ResponseFactory.success('Role retrieved successfully', roleData);
            return {
                code: response.code,
                message: response.message,
                role: roleData
            };
        } catch (error) {
            const response = ResponseFactory.notFound('Role not found');
            return {
                code: response.code,
                message: response.message,
                role: undefined
            };
        }
    }

    // 3. Create a new role
    @Mutation(() => ApiResponse) async createRole(@Args('input') input: CreateRoleInput,): Promise<ApiResponse> {
        const role = new roleEntity();
        role.name = input.name;
        role.description = input.description || "N/A";
        await this.rolesService.create(role);
        const response = ResponseFactory.success('Role created successfully');
        return {
            code: response.code,
            message: response.message
        };
    }

    // 4. Update an existing role
    @Mutation(() => RoleResponse) async updateRole(@Args('id') id: number, @Args('input') input: CreateRoleInput,):
        Promise<RoleResponse> {
        try {
            const role = await this.rolesService.getById(id);
            role.name = input.name;
            const updatedRole = await this.rolesService.update(id, role);
            const response = ResponseFactory.success('Role updated successfully', updatedRole);
            return {
                code: response.code,
                message: response.message,
                role: updatedRole
            };
        } catch (error) {
            const response = ResponseFactory.notFound('Role not found');
            return {
                code: response.code,
                message: response.message,
                role: undefined
            };
        }
    }

    // 5. Delete a role by ID
    @Mutation(() => RolesResponse) async deleteRole(@Args('id') id: number,): Promise<RolesResponse> {
        try {
            await this.rolesService.delete(id);
            const response = ResponseFactory.success('Role deleted successfully');
            return {
                code: response.code,
                message: response.message,
                roles: []
            };
        } catch (error) {
            const response = ResponseFactory.notFound('Role not found');
            return {
                code: response.code,
                message: response.message,
                roles: []
            };
        }
    }
}