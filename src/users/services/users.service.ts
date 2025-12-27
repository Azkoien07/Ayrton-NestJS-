import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { userEntity } from '@/src/users/entity/user.entity';
import { BaseDao } from '@/src/common/dao/base.dao';
import * as bcrypt from 'bcrypt';
import { PaginatedResult } from '@/src/utilities/paginatedResponse';
import { BulkImportHelper } from '@/src/utilities/bulk-import.helper';

@Injectable()
export class UsersService extends BaseDao<userEntity, number> {

    private readonly logger = new Logger(UsersService.name);

    // Implementing abstract methods from BaseDao
    constructor(
        @InjectRepository(userEntity)
        private readonly usersRepository: Repository<userEntity>,
    ) {
        super();
    }

    // Find all users with pagination
    async findAll(page: number, limit = 10,): Promise<PaginatedResult<userEntity>> {
        const currentPage = Math.max(page, 1);
        const pageSize = Math.min(limit, 10);
        const offset = (currentPage - 1) * pageSize;

        const data = await this.usersRepository.find({
            order: { id: 'ASC' },
            skip: offset,
            take: pageSize,
        });

        // Conditional total count calculation
        let total = 0;
        let totalPages = 0;

        if (currentPage === 1) {
            total = await this.usersRepository.count();
            totalPages = Math.ceil(total / pageSize);
        }

        return {
            data,
            page: currentPage,
            limit: pageSize,
            total,
            totalPages,
        };
    }

    // Find user by ID
    async getById(id: number): Promise<userEntity> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    // Create a new user
    async create(entity: userEntity): Promise<userEntity> {
        return this.usersRepository.save(entity);
    }

    // Update an existing user
    async update(id: number, entity: Partial<userEntity>,): Promise<userEntity> {
        await this.usersRepository.update(id, entity);
        return this.getById(id);
    }

    // Delete a user by ID
    async delete(id: number): Promise<void> {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('User not found');
        }
    }

    // Add Massive Users
    async addMassiveUsers(filepath: string, originalname: string): Promise<void> {
        const ext = originalname.split('.').pop()?.toLowerCase();

        const config = {
            repository: this.usersRepository,
            logger: this.logger,
            batchSize: 400,
            entityName: 'users',
            ignoreDuplicates: true,
        };

        const rowMapper = async (row: any): Promise<Partial<userEntity> | null> => {
            let email: string;
            let password: string;
            let roleId: number;

            if (row.getCell) {
                // XLSX - Formato: Col1=Email, Col2=Password, Col3=RoleId
                const emailCell = row.getCell(1);
                const passwordCell = row.getCell(2);
                const roleCell = row.getCell(3);

                email = emailCell?.value ? String(emailCell.value).trim() : '';
                password = passwordCell?.value ? String(passwordCell.value).trim() : '';
                roleId = roleCell?.value ? Number(roleCell.value) : 1;
            } else {
                // CSV - Plain object
                email = row.email ? String(row.email).trim() : '';
                password = row.password ? String(row.password).trim() : '';
                roleId = row.roleId ? Number(row.roleId) : 1;
            }

            // Validar email y password
            if (!email || !password || !email.includes('@')) {
                return null;
            }

            // Usar 4 rondas de bcrypt para importaciones masivas
            return {
                email: email.toLowerCase(),
                password: await bcrypt.hash(password, 4),
                role: { id: roleId } as any,
            };
        };

        try {
            if (ext === 'csv') {
                await BulkImportHelper.importFromCsv(filepath, config, rowMapper);
            } else if (ext === 'xlsx') {
                await BulkImportHelper.importFromXlsx(filepath, config, rowMapper);
            } else {
                throw new Error('Unsupported file format. Please upload a CSV or XLSX file.');
            }
        } catch (error) {
            this.logger.error(`[UsersService] Bulk import failed: ${error.message}`, error.stack);
            throw error;
        }
    }
}