import { Query, Resolver, Args, Mutation, Int, ID } from '@nestjs/graphql';
import { Person } from '../models/person.model';
import { PersonsService } from '../services/persons.service';
import { ApiResponse } from '@/src/common/http/response';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { CreatePersonInput } from '../dto/createPerson.input';
import { personEntity } from '../entity/person.entity';
import { documentTypeEntity } from '@/src/document-type/entity/documentType.entity';
import { userEntity } from '@/src/users/entity/user.entity';
import { roleEntity } from '@/src/roles/entity/role.entity';
import * as bcrypt from 'bcrypt';
import { UploadScalar } from '@/src/utilities/upload.scalar';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Resolver(() => Person)
export class PersonsResolver {

    constructor(private readonly personsService: PersonsService) { }

    // 1. Get all persons with pagination
    @Query(() => ApiResponse)
    async persons(
        @Args('page', { type: () => Int }) page: number,
        @Args('limit', { type: () => Int }) limit: number
    ): Promise<ApiResponse> {
        const response = await this.personsService.findAll(page, limit);

        if (response.data.length === 0) {
            return ResponseFactory.notFound('No persons found');
        }
        return ResponseFactory.success(
            'Persons retrieved successfully',
            response,
        );
    }

    // 2. Get person by ID
    @Query(() => ApiResponse)
    async person(@Args('id', { type: () => ID }) id: number): Promise<ApiResponse<Person>> {
        try {
            const personData = await this.personsService.getById(id);
            return ResponseFactory.success('Person retrieved successfully', personData);
        } catch (error) {
            return ResponseFactory.notFound('Person not found');
        }
    }

    // 3. Create a new person with user
    @Mutation(() => ApiResponse)
    async createPerson(@Args('input') input: CreatePersonInput): Promise<ApiResponse> {
        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create user entity
        const user = new userEntity();
        user.email = input.email;
        user.password = hashedPassword;
        user.role = { id: input.roleId || 1 } as roleEntity;
        user.createdAt = new Date();

        // Create person entity with nested user
        const person = new personEntity();
        person.firstName = input.firstName;
        person.lastName = input.lastName;
        person.document = input.document;
        person.phone = input.phone;
        person.bloodType = input.bloodType;
        person.address = input.address;
        person.photo = input.photo;
        person.state = input.state;
        person.documentType = { id: input.documentTypeId } as documentTypeEntity;
        person.user = user; // Nested user (cascade will save it)
        person.createdAt = new Date();

        await this.personsService.create(person);

        return ResponseFactory.created('Person and User created successfully');
    }

    // 4. Update an existing person
    @Mutation(() => ApiResponse)
    async updatePerson(
        @Args('id', { type: () => ID }) id: number,
        @Args('input') input: CreatePersonInput
    ): Promise<ApiResponse<Person>> {
        try {
            const updateData: Partial<personEntity> = {
                firstName: input.firstName,
                lastName: input.lastName,
                document: input.document,
                phone: input.phone,
                bloodType: input.bloodType,
                address: input.address,
                photo: input.photo,
                state: input.state,
                documentType: { id: input.documentTypeId } as documentTypeEntity,
            };
            const updatedPerson = await this.personsService.update(id, updateData);
            return ResponseFactory.success('Person updated successfully', updatedPerson);
        } catch (error) {
            return ResponseFactory.notFound('Person not found');
        }
    }

    // 5. Delete a person by ID
    @Mutation(() => ApiResponse)
    async deletePerson(@Args('id', { type: () => ID }) id: number): Promise<ApiResponse> {
        try {
            await this.personsService.delete(id);
            return ResponseFactory.success('Person deleted successfully');
        } catch (error) {
            return ResponseFactory.notFound('Person not found');
        }
    }

    // 6. Bulk Upload Persons with Users
    @Mutation(() => ApiResponse)
    async bulkUploadPersons(
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
                return ResponseFactory.badRequest('Invalid file type. Only CSV and XLSX are supported.');
            }

            const uploadDir = join(process.cwd(), 'uploads', 'temp');
            const fs = require('fs');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const uniqueFilename = `${uuid()}-${filename}`;
            const filepath = join(uploadDir, uniqueFilename);

            await new Promise<void>((resolve, reject) => {
                const writeStream = createWriteStream(filepath);
                createReadStream()
                    .pipe(writeStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });

            await this.personsService.addMassivePersons(filepath, filename);

            // Cleanup temp file
            fs.unlinkSync(filepath);

            return ResponseFactory.success('Persons and Users bulk upload completed successfully');
        } catch (error) {
            return ResponseFactory.error(`Bulk upload failed: ${error.message}`);
        }
    }
}
