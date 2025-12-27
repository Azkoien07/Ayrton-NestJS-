import { Injectable } from '@nestjs/common';
import { BaseDao } from '@/src/common/dao/base.dao';
import { roleEntity } from '../entity/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '@/src/utilities/paginatedResponse';

@Injectable()
export class RolesService extends BaseDao<roleEntity, number> {

    constructor(
        @InjectRepository(roleEntity)
        private readonly rolesRepository: Repository<roleEntity>,
    ) {
        super();
    }

    // Seed initial roles
    async onModuleInit() {
        const roles = [
            { name: 'Admin', description: 'Administrator with full access' },
            { name: 'User', description: 'Regular user with limited access' },
        ];

        for (const role of roles) {
            const exists = await this.rolesRepository.findOne({ where: { name: role.name } });
            if (!exists) {
                await this.rolesRepository.save(role);
                console.log(`Role "${role.name}" seeded`);
            }
        }
    }

    // Find all Roles With Pagination
    async findAll(page: number, limit: number): Promise<PaginatedResult<roleEntity>> {
        const [data, total] = await this.rolesRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    // Find Role By ID
    async getById(id: number): Promise<roleEntity> {
        const role = await this.rolesRepository.findOne({ where: { id } });
        if (!role) throw new Error('Role not found');
        return role;
    }

    // Create a new Role
    async create(entity: roleEntity): Promise<roleEntity> {
        return this.rolesRepository.save(entity);
    }

    // Update an existing Role
    async update(id: number, input: Partial<roleEntity>): Promise<roleEntity> {
        const role = await this.rolesRepository.findOne({
            where: { id: Number(id) },
        });

        if (!role) {
            throw new Error('Role not found');
        }

        Object.assign(role, input);

        return this.rolesRepository.save(role);
    }


    // Delete a Role by ID
    async delete(id: number): Promise<void> {
        const result = await this.rolesRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Role not found');
        }
    }
}
