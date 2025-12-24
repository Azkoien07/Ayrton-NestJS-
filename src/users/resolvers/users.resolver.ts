import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from '../services/users.service';
import { RolesService } from '@/src/roles/services/roles.service';
import { User } from '../models/user.model';
import { CreateUserInput } from '../dto/createUser.input';
import { userEntity } from '../entity/user.entity';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { ApiResponse } from '@/src/common/http/response';
import * as bcrypt from 'bcrypt';
import { FileUpload } from 'graphql-upload-minimal';
import { UploadScalar } from '@/src/utilities/upload.scalar';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Resolver(() => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService, private readonly rolesService: RolesService) { }

    // 1. Get all users with pagination
    @Query(() => ApiResponse) 
    async users(
        @Args('page',) page: number, 
        @Args('limit',) limit: number,
    ): Promise<ApiResponse<User[]>> {
        const usersData = await this.usersService.findAll(page, limit);

        if (usersData.length === 0) {
            return ResponseFactory.notFound('No users found');
        }

        return ResponseFactory.success('Users retrieved successfully', usersData);
    }

    // 2. Get user by ID
    @Query(() => ApiResponse) 
    async user(@Args('id') id: number): Promise<ApiResponse<User>> {
        try {
            const userData = await this.usersService.getById(id);
            return ResponseFactory.success('User retrieved successfully', userData);
        } catch (error) {
            return ResponseFactory.notFound('User not found');
        }
    }

    // 3. Create a new user
    @Mutation(() => ApiResponse) 
    async createUser(@Args('input') input: CreateUserInput): Promise<ApiResponse> {
        const user = new userEntity();
        user.email = input.email;
        user.password = input.password;
        const roleId = input.roleId || 1;
        user.role = await this.rolesService.getById(roleId);
        user.createdAt = new Date();
        await this.usersService.create(user);

        return ResponseFactory.created('Usuario creado correctamente');
    }

    // 4. Update an existing user
    @Mutation(() => ApiResponse) 
    async updateUser(
        @Args('id') id: number, 
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

    // 5. Delete a user by ID
    @Mutation(() => ApiResponse) 
    async deleteUser(@Args('id') id: number): Promise<ApiResponse> {
        try {
            await this.usersService.delete(id);
            return ResponseFactory.success('User deleted successfully');
        } catch (error) {
            return ResponseFactory.notFound('User not found');
        }
    }

    // 6. Add Massive Users
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

            await this.usersService.addMassiveUsers(tempPath, ext);

            return ResponseFactory.success('Bulk users upload completed');
        } catch (error) {
            return ResponseFactory.error('Error processing bulk upload');
        }
    }

}