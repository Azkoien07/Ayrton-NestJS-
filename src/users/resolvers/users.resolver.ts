import { Args, Mutation, Query, Resolver, Int, ID } from '@nestjs/graphql';
import { UsersService } from '../services/users.service';
import { RolesService } from '@/src/roles/services/roles.service';
import { User } from '../models/user.model';
import { UserPage, UserSingle } from '../models/user.page';
import { CreateUserInput } from '../dto/createUser.input';
import { userEntity } from '../entity/user.entity';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { ApiResponse } from '@/src/common/http/response';
import * as bcrypt from 'bcrypt';
import { UploadScalar } from '@/src/utilities/upload.scalar';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Resolver(() => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService, private readonly rolesService: RolesService) { }

    // 1. Get all users with pagination
    @Query(() => UserPage) async users(@Args('page', { type: () => Int }) page: number, @Args('limit', { type: () => Int }) limit: number
    ): Promise<UserPage> {
        const response = await this.usersService.findAll(page, limit);

        if (response.data.length === 0) {
            return {
                code: 404,
                message: 'No users found',
                data: [],
            };
        }

        return {
            code: 200,
            message: 'Users retrieved successfully',
            data: response.data,
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages,
        };
    }


    // 2. Get user by ID
    @Query(() => UserSingle)
    async user(@Args('id', { type: () => ID }) id: number): Promise<UserSingle> {
        try {
            const userData = await this.usersService.getById(id);
            return {
                code: 200,
                message: 'User retrieved successfully',
                data: userData,
            };
        } catch (error) {
            return {
                code: 404,
                message: 'User not found',
            };
        }
    }

    // 3. Update an existing user
    @Mutation(() => ApiResponse)
    async updateUser(
        @Args('id', { type: () => ID }) id: number,
        @Args('input') input: CreateUserInput
    ): Promise<ApiResponse> {
        try {
            const user = await this.usersService.getById(id);
            user.email = input.email;
            if (input.password) {
                const salt = await bcrypt.genSalt();
                user.password = await bcrypt.hash(input.password, salt);
            }
            await this.usersService.update(id, user);
            return ResponseFactory.success('User updated successfully');
        } catch (error) {
            return ResponseFactory.notFound('User not found');
        }
    }

    // 4. Add Massive Users
    @Mutation(() => ApiResponse)
    async bulkUploadUsers(
        @Args({ name: 'file', type: () => UploadScalar }) file: any,
    ): Promise<ApiResponse> {
        try {
            if (!file) {
                return ResponseFactory.badRequest('File not provided');
            }

            let fileData;
            if (file.promise) {
                fileData = await file.promise;
            } else if (file.file) {
                fileData = file.file;
            } else if (file instanceof Promise) {
                fileData = await file;
            } else {
                fileData = file;
            }

            const { createReadStream, filename } = fileData;

            if (!filename) {
                return ResponseFactory.badRequest('Filename not found');
            }

            const ext = filename.split('.').pop()?.toLowerCase();

            if (!ext) {
                return ResponseFactory.badRequest('File extension not found');
            }

            if (!['csv', 'xlsx'].includes(ext)) {
                return ResponseFactory.badRequest('Only CSV or XLSX files are allowed');
            }

            const tmpDir = join(process.cwd(), 'tmp');

            if (!require('fs').existsSync(tmpDir)) {
                require('fs').mkdirSync(tmpDir);
            }

            const tempPath = join(
                tmpDir,
                `${uuid()}.${ext}`,
            );

            await new Promise<void>((resolve, reject) => {
                createReadStream()
                    .pipe(createWriteStream(tempPath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await this.usersService.addMassiveUsers(tempPath, filename);

            return ResponseFactory.success('Bulk users upload completed');
        } catch (error) {
            return ResponseFactory.error('Error processing bulk upload');
        }
    }

}