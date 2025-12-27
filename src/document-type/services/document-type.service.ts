import { BaseDao } from '@/src/common/dao/base.dao';
import { Injectable } from '@nestjs/common';
import { documentTypeEntity } from '../entity/documentType.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '@/src/utilities/paginatedResponse';

@Injectable()
export class DocumentTypeService extends BaseDao<documentTypeEntity, number> {

    constructor(
        @InjectRepository(documentTypeEntity)
        private readonly documentTypeRepository: Repository<documentTypeEntity>,
    ) {
        super();
    }

    // Seed initial Document Types
    async onModuleInit() {
        const documentTypes = [
            { name: 'Cedula de Ciudadania', acronym: 'CC', state: true },
            { name: 'Cedula de Extranjeria', acronym: 'CE', state: true },
            { name: 'Tarjeta de Identidad', acronym: 'TI', state: true },
            { name: 'Passport', acronym: 'PP', state: true },
            { name: 'NIT', acronym: 'NIT', state: true },
            { name: 'Permiso Especial de Permanencia', acronym: 'PEP', state: true },
            { name: 'Permiso de Protección Especial', acronym: 'PPE', state: true },
        ];


        for (const documentType of documentTypes) {
            const exists = await this.documentTypeRepository.findOne({ where: { name: documentType.name } });
            if (!exists) {
                await this.documentTypeRepository.save(documentType);
                console.log(`Document Type "${documentType.name}" seeded`);
            }

        }
    }

    // Find all Document Types
    async findAll(page: number, limit: number): Promise<PaginatedResult<documentTypeEntity>> {
        const currentPage = Math.max(page, 1);
        const pageSize = Math.min(limit, 10);
        const offset = (currentPage - 1) * pageSize;

        const data = await this.documentTypeRepository.find({
            order: { id: 'ASC' },
            skip: offset,
            take: pageSize,
        });

        // Conditional totsll count calculation
        let total = 0;
        let totalPages = 0;

        if (currentPage === 1) {
            total = await this.documentTypeRepository.count();
            totalPages = Math.ceil(total / pageSize);
        }

        return {
            data,
            page: currentPage,
            limit: pageSize,
            total,
            totalPages,
        }
    }

    // Find Document Type by ID
    async getById(id: number): Promise<documentTypeEntity> {
        const documentType = await this.documentTypeRepository.findOne({ where: { id } });
        if (!documentType) throw new Error('Document Type not found');
        return documentType;
    }

    // Create a new Document Type
    async create(entity: documentTypeEntity): Promise<documentTypeEntity> {
        return this.documentTypeRepository.save(entity);
    }

    // Update an existing Document Type
    async update(id: number, entity: Partial<documentTypeEntity>,): Promise<documentTypeEntity> {
        await this.documentTypeRepository.update(id, entity);
        return this.getById(id);
    }

    // Delete a Document Type by ID
    async delete(id: number): Promise<void> {
        const result = await this.documentTypeRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Document Type not found');
        }
    }
}