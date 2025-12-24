import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { userEntity } from '../entity/user.entity';
import { BaseDao } from '@/src/common/dao/base.dao';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as bcrypt from 'bcrypt';
import * as ExcelJS from 'exceljs';

@Injectable()
export class UsersService extends BaseDao<userEntity, number> {

    private readonly logger = new Logger(UsersService.name);
    private readonly BATCH_SIZE = 1000;

    // Implementing abstract methods from BaseDao
    constructor(
        @InjectRepository(userEntity)
        private readonly usersRepository: Repository<userEntity>,
    ) {
        super();
    }

    // Find all users with pagination
    async findAll(page: number, limit: number): Promise<userEntity[]> {
        return this.usersRepository.find({
            skip: (page - 1) * limit,
            take: limit,
        });
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

        this.logger.log(`Starting massive import from file: ${originalname}`);

        if (ext === 'csv') {
            await this.importFromCsv(filepath);

        } else if (ext === 'xlsx') {
            await this.importFromXlsx(filepath);
        } else {
            throw new Error('Unsupported file format. Please upload a CSV or XLSX file.');

        }
        this.logger.log(`Finished massive import from file: ${originalname}`);
    }

    /* ======================
       CSV IMPORT
    ====================== */
    private async importFromCsv(FilePath: string): Promise<void> {
        let batch: Partial<userEntity>[] = [];

        const stream = fs.createReadStream(FilePath).pipe(csv());

        for await (const row of stream) {
            const user = await this.mapRowToUser(row);
            if (!user) continue;

            batch.push(user);

            if (batch.length >= this.BATCH_SIZE) {
                await this.usersRepository.save(batch);
                batch = [];
            }
        }

        if (batch.length) {
            await this.insertBatch(batch);
        }

    }

    /* ======================
       XLSX IMPORT (STREAM)
    ====================== */
    private async importFromXlsx(filePath: string): Promise<void> {
        const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
            entries: 'emit',
            worksheets: 'emit',
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
        });
        let batch: Partial<userEntity>[] = [];

        for await (const worksheet of workbook) {
            for await (const row of worksheet) {
                if (row.number === 1) continue; // Skip header row

                const data = {
                    email: row.getCell(1).text,
                    password: row.getCell(2).text,
                    roleId: Number(row.getCell(3).text) || 1,
                };

                const user = await this.mapRowToUser(data);
                if (!user) continue;

                batch.push(user);

                if (batch.length >= this.BATCH_SIZE) {
                    await this.insertBatch(batch);
                    batch = [];
                }
            }
        }

        if (batch.length) {
            await this.insertBatch(batch);
        }
    }

    /* ======================
       HELPERS
    ====================== */
    private async mapRowToUser(row: any): Promise<Partial<userEntity> | null> {
        if (!row.email || !row.password) return null;

        return {
            email: row.email.trim().toLowerCase(),
            password: await bcrypt.hash(row.password, 10),
            role: { id: Number(row.roleId) || 1 } as any,
        };
    }

    private async insertBatch(batch: Partial<userEntity>[]): Promise<void> {
        await this.usersRepository
            .createQueryBuilder()
            .insert()
            .into(userEntity)
            .values(batch)
            .execute();

        this.logger.log(`Inserted batch of ${batch.length}`);
    }
}