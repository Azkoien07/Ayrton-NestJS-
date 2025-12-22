import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from '../services/users.service';
import { User } from '../models/user.model';
import { CreateUserInput } from '../dto/createUser.input';
import { userEntity } from '../entity/user.entity';
import * as bcrypt from 'bcrypt';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { ApiResponse } from '@/src/common/http/response';
import { UsersResponse, UserResponse } from '../models/users.response';

@Resolver(() => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) { }

    // 1. Get all users with pagination
    @Query(() => UsersResponse)
    async users(
        @Args('page',) page: number,
        @Args('limit',) limit: number,
    ): Promise<UsersResponse> {
        const usersData = await this.usersService.findAll(page, limit);

        if (usersData.length === 0) {
            return {
                code: 404,
                message: 'No users found',
                users: []
            };
        }

        return {
            code: 200,
            message: 'Users retrieved successfully',
            users: usersData
        };
    }

    // 2. Get user by ID
    @Query(() => UserResponse)
    async user(
        @Args('id') id: number,
    ): Promise<UserResponse> {
        try {
            const userData = await this.usersService.getById(id);
            return {
                code: 200,
                message: 'User retrieved successfully',
                user: userData
            };
        } catch (error) {
            return {
                code: 404,
                message: 'User not found',
                user: undefined
            };
        }
    }

    // 3. Create a new user
    @Mutation(() => ApiResponse)
    async createUser(
        @Args('input') input: CreateUserInput,
    ): Promise<ApiResponse> {
        const user = new userEntity();
        user.email = input.email;
        user.password = input.password;
        user.role = 'USER';
        user.createdAt = new Date();
        await this.usersService.create(user);

        return ResponseFactory.created('Usuario creado correctamente');
    }
}