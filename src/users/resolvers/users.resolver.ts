import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from '../services/users.service';
import { RolesService } from '@/src/roles/services/roles.service';
import { User } from '../models/user.model';
import { CreateUserInput } from '../dto/createUser.input';
import { userEntity } from '../entity/user.entity';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { ApiResponse } from '@/src/common/http/response';
import { UsersResponse, UserResponse } from '../models/users.response';
import * as bcrypt from 'bcrypt';

@Resolver(() => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService, private readonly rolesService: RolesService) { }

    // 1. Get all users with pagination
    @Query(() => UsersResponse) async users(@Args('page',) page: number, @Args('limit',) limit: number,): Promise<UsersResponse> {
        const usersData = await this.usersService.findAll(page, limit);

        if (usersData.length === 0) {
            const response = ResponseFactory.notFound('No users found');
            return {
                code: response.code,
                message: response.message,
                users: []
            };
        }

        const response = ResponseFactory.success('Users retrieved successfully', usersData);
        return {
            code: response.code,
            message: response.message,
            users: usersData
        };
    }

    // 2. Get user by ID
    @Query(() => UserResponse) async user(@Args('id') id: number,
    ): Promise<UserResponse> {
        try {
            const userData = await this.usersService.getById(id);
            const response = ResponseFactory.success('User retrieved successfully', userData);
            return {
                code: response.code,
                message: response.message,
                user: userData
            };
        } catch (error) {
            const response = ResponseFactory.notFound('User not found');
            return {
                code: response.code,
                message: response.message,
                user: undefined
            };
        }
    }

    // 3. Create a new user
    @Mutation(() => ApiResponse) async createUser(@Args('input') input: CreateUserInput,): Promise<ApiResponse> {
        const user = new userEntity();
        user.email = input.email;
        user.password = input.password;
        // Asigna el rol por ID (usa el del input o 1 por defecto - Admin)
        const roleId = input.roleId || 1;
        user.role = await this.rolesService.getById(roleId);
        user.createdAt = new Date();
        await this.usersService.create(user);

        return ResponseFactory.created('Usuario creado correctamente');
    }

    // 4. Update existing user
    @Mutation(() => ApiResponse) async updateUser(@Args('id') id: number, @Args('input') input: CreateUserInput,
    ): Promise<ApiResponse> {
        try {
            const user = await this.usersService.getById(id);
            user.email = input.email;
            if (input.password) {
                const salt = await bcrypt.genSalt();
                user.password = await bcrypt.hash(input.password, salt);
            }
            await this.usersService.update(id, user);

            const response = ResponseFactory.success('User updated successfully');
            return {
                code: response.code,
                message: response.message
            }
        } catch (error) {
            const response = ResponseFactory.notFound('User not found');
            return {
                code: response.code,
                message: response.message
            };
        }
    }

    // 5. Delete user by ID
    @Mutation(() => ApiResponse) async deleteUser(@Args('id') id: number,): Promise<ApiResponse> {
        try {
            await this.usersService.delete(id);
            const response = ResponseFactory.success('User deleted successfully');
            return {
                code: response.code,
                message: response.message
            };
        } catch (error) {
            const response = ResponseFactory.notFound('User not found');
            return {
                code: response.code,
                message: response.message
            };
        }
    }
}