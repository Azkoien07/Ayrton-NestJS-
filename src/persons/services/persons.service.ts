import { BaseDao } from '@/src/common/dao/base.dao';
import { Injectable, Logger } from '@nestjs/common';
import { personEntity } from '../entity/person.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '@/src/utilities/paginatedResponse';
import { PersonsBulkImportHelper } from '../helpers/persons-bulk-import.helper';

@Injectable()
export class PersonsService extends BaseDao<personEntity, number> {

    private readonly logger = new Logger(PersonsService.name);

    // Implementing abstract methods from BaseDao
    constructor(
        @InjectRepository(personEntity)
        private readonly personsRepository: Repository<personEntity>,
    ) {
        super();
    }

    // Find all Persons with pagination
    async findAll(page: number, limit: number): Promise<PaginatedResult<personEntity>> {
        const currentPage = Math.max(page, 1);
        const pageSize = Math.min(limit, 10);
        const offset = (currentPage - 1) * pageSize;

        const data = await this.personsRepository.find({
            order: { id: 'ASC' },
            skip: offset,
            take: pageSize,
        });

        // Conditional total count calculation
        let total = 0;
        let totalPages = 0;

        if (currentPage === 1) {
            total = await this.personsRepository.count();
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

    // Find person by ID
    async getById(id: number): Promise<personEntity> {
        const person = await this.personsRepository.findOne({ where: { id } });
        if (!person) throw new Error('Person not found');
        return person;
    }

    // Create a new person
    async create(entity: personEntity): Promise<personEntity> {
        return this.personsRepository.save(entity);
    }

    // Update an existing person
    async update(id: number, entity: Partial<personEntity>,): Promise<personEntity> {
        await this.personsRepository.update(id, entity);
        return this.getById(id);
    }

    // Delete a person by ID
    async delete(id: number): Promise<void> {
        const result = await this.personsRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Person not found');
        }
    }

    // Add Massive Persons with Users (Optimized with parallel password hashing)
    async addMassivePersons(filepath: string, originalname: string): Promise<void> {
        await PersonsBulkImportHelper.importFromFile(
            filepath,
            originalname,
            this.personsRepository,
            this.logger,
        );
    }
}
