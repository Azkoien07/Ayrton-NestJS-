import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BulkImportHelper, RowMapper, CustomBatchInserter } from '@/src/utilities/bulk-import.helper';
import { personEntity } from '../entity/person.entity';
import { userEntity } from '@/src/users/entity/user.entity';

interface PersonWithUser {
    person: {
        firstName: string;
        lastName: string;
        document: string;
        phone: string;
        bloodType: string;
        address: string;
        photo: string;
        state: boolean;
        document_type_id: number; // snake_case en DB
        createdAt: Date;
    };
    user: {
        email: string;
        password: string;
        role_id: number; // snake_case en DB
        person_id: number; // snake_case en DB
        createdAt: Date;
    };
    _rawPassword?: string;
}

interface RawPersonData {
    firstName: string;
    lastName: string;
    document: string;
    phone: string;
    bloodType: string;
    address: string;
    photo: string;
    state: boolean;
    documentTypeId: number;
    email: string;
    password: string;
    roleId: number;
}

export class PersonsBulkImportHelper {
    /**
     * Imports persons with users from CSV or XLSX file
     */
    static async importFromFile(
        filepath: string,
        originalname: string,
        repository: Repository<personEntity>,
        logger: Logger,
    ): Promise<void> {
        const rowMapper = this.createRowMapper();
        const customInserter = this.createCustomInserter();

        await BulkImportHelper.importFromFile<PersonWithUser>(
            filepath,
            originalname,
            {
                repository: repository as any,
                logger,
                batchSize: 130, // SQL Server limit: 2100 params. 130 records * 16 fields = 2080 params (safe)
                entityName: 'persons with users',
                ignoreDuplicates: true,
                customInserter,
            },
            rowMapper,
        );
    }

    /**
     * Creates row mapper function for parsing CSV/XLSX rows
     */
    private static createRowMapper(): RowMapper<PersonWithUser> {
        return async (row: any): Promise<Partial<PersonWithUser> | null> => {
            const isExcelRow = 'getCell' in row && typeof row.getCell === 'function';

            let firstName: string;
            let lastName: string;
            let document: string;
            let phone: string;
            let bloodType: string;
            let address: string;
            let photo: string;
            let state: boolean;
            let documentTypeId: number;
            let email: string;
            let password: string;
            let roleId: number;

            if (isExcelRow) {
                // XLSX
                firstName = row.getCell(1)?.value ? String(row.getCell(1).value).trim() : '';
                lastName = row.getCell(2)?.value ? String(row.getCell(2).value).trim() : '';
                document = row.getCell(3)?.value ? String(row.getCell(3).value).trim() : '';
                phone = row.getCell(4)?.value ? String(row.getCell(4).value).trim() : '';
                bloodType = row.getCell(5)?.value ? String(row.getCell(5).value).trim() : '';
                address = row.getCell(6)?.value ? String(row.getCell(6).value).trim() : '';
                photo = row.getCell(7)?.value ? String(row.getCell(7).value).trim() : 'N/A';
                state = row.getCell(8)?.value ? Boolean(row.getCell(8).value) : true;
                documentTypeId = row.getCell(9)?.value ? Number(row.getCell(9).value) : 1;
                email = row.getCell(10)?.value ? String(row.getCell(10).value).trim() : '';
                password = row.getCell(11)?.value ? String(row.getCell(11).value).trim() : '';
                roleId = row.getCell(12)?.value ? Number(row.getCell(12).value) : 1;
            } else {
                // CSV
                firstName = row.firstName ? String(row.firstName).trim() : '';
                lastName = row.lastName ? String(row.lastName).trim() : '';
                document = row.document ? String(row.document).trim() : '';
                phone = row.phone ? String(row.phone).trim() : '';
                bloodType = row.bloodType ? String(row.bloodType).trim() : '';
                address = row.address ? String(row.address).trim() : '';
                photo = row.photo ? String(row.photo).trim() : 'N/A';
                state = row.state ? Boolean(row.state) : true;
                documentTypeId = row.documentTypeId ? Number(row.documentTypeId) : 1;
                email = row.email ? String(row.email).trim() : '';
                password = row.password ? String(row.password).trim() : '';
                roleId = row.roleId ? Number(row.roleId) : 1;
            }

            // Validar campos requeridos
            if (!firstName || !lastName || !document || !email || !password || !email.includes('@')) {
                return null;
            }

            // NO hashear aquí - se hará en paralelo en el customInserter para mayor velocidad
            return {
                person: {
                    firstName: firstName,
                    lastName: lastName,
                    document,
                    phone,
                    bloodType: bloodType,
                    address,
                    photo,
                    state,
                    document_type_id: documentTypeId, // snake_case para DB
                    createdAt: new Date(),
                },
                user: {
                    email: email.toLowerCase(),
                    password: '',
                    role_id: roleId, // snake_case para DB
                    person_id: 0, // Se llenará después del insert
                    createdAt: new Date(),
                },
                _rawPassword: password,
            };
        };
    }

    /**
     * Creates custom inserter for multi-table insert (persons + users)
     */
    private static createCustomInserter(): CustomBatchInserter<PersonWithUser> {
        return async (
            batch: Partial<PersonWithUser>[],
            repository: Repository<PersonWithUser>
        ): Promise<number> => {
            // 1. Hash all passwords in parallel for maximum speed
            const hashPromises = batch.map(record =>
                bcrypt.hash(record._rawPassword || 'default123', 1) // 1 round = más rápido
            );
            const hashedPasswords = await Promise.all(hashPromises);

            // 2. Asignar passwords hasheadas al batch
            batch.forEach((record, index) => {
                if (record.user) {
                    record.user.password = hashedPasswords[index];
                }
                delete record._rawPassword; // Limpiar
            });

            const queryRunner = (repository as any).manager.connection.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                // 3. Insert persons in bulk usando la entidad para mapeo correcto
                const personInsertResult = await queryRunner.manager
                    .createQueryBuilder()
                    .insert()
                    .into(personEntity)
                    .values(batch.map(r => ({
                        firstName: r.person?.firstName,
                        lastName: r.person?.lastName,
                        document: r.person?.document,
                        phone: r.person?.phone,
                        bloodType: r.person?.bloodType,
                        address: r.person?.address,
                        photo: r.person?.photo,
                        state: r.person?.state,
                        documentType: { id: r.person?.document_type_id } as any,
                        createdAt: r.person?.createdAt,
                    })))
                    .output('INSERTED.id')
                    .execute();

                // 4. Get inserted person IDs from OUTPUT clause
                const insertedIds = personInsertResult.raw && personInsertResult.raw.length > 0
                    ? personInsertResult.raw.map((row: any) => row.id)
                    : personInsertResult.identifiers.map((id: any) => id.id);

                // 5. Insert users with person_id relationship
                const usersToInsert = batch.map((r, index) => ({
                    email: r.user?.email,
                    password: r.user?.password,
                    role_id: r.user?.role_id,
                    person_id: insertedIds[index],
                    createdAt: r.user?.createdAt,
                }));

                await queryRunner.manager
                    .createQueryBuilder()
                    .insert()
                    .into(userEntity)
                    .values(usersToInsert.map(u => ({
                        email: u.email,
                        password: u.password,
                        role: { id: u.role_id } as any,
                        person: { id: u.person_id } as any,
                        createdAt: u.createdAt,
                    })))
                    .execute();

                await queryRunner.commitTransaction();
                return batch.length;

            } catch (error) {
                await queryRunner.rollbackTransaction();
                console.error('[Bulk Import] Batch insert failed, trying individual inserts:', error.message);

                // Si falla, intentar uno por uno para saltar duplicados
                let savedCount = 0;
                const duplicates: Array<{ document: string, email: string, firstName: string, lastName: string }> = [];

                for (let i = 0; i < batch.length; i++) {
                    const record = batch[i];
                    try {
                        await queryRunner.startTransaction();

                        const personResult = await queryRunner.manager
                            .createQueryBuilder()
                            .insert()
                            .into(personEntity)
                            .values([{
                                firstName: record.person?.firstName,
                                lastName: record.person?.lastName,
                                document: record.person?.document,
                                phone: record.person?.phone,
                                bloodType: record.person?.bloodType,
                                address: record.person?.address,
                                photo: record.person?.photo,
                                state: record.person?.state,
                                documentType: { id: record.person?.document_type_id } as any,
                                createdAt: record.person?.createdAt,
                            }])
                            .output('INSERTED.id')
                            .execute();

                        const personId = personResult.raw[0].id;

                        await queryRunner.manager
                            .createQueryBuilder()
                            .insert()
                            .into(userEntity)
                            .values([{
                                email: record.user?.email,
                                password: record.user?.password,
                                role: { id: record.user?.role_id } as any,
                                person: { id: personId } as any,
                                createdAt: record.user?.createdAt,
                            }])
                            .execute();

                        await queryRunner.commitTransaction();
                        savedCount++;
                    } catch (err: any) {
                        await queryRunner.rollbackTransaction();

                        // Detectar si es duplicado (documento o email)
                        if (err.message.includes('duplicate') || err.message.includes('unique') || err.message.includes('Violation of UNIQUE KEY')) {
                            duplicates.push({
                                document: record.person?.document || '',
                                email: record.user?.email || '',
                                firstName: record.person?.firstName || '',
                                lastName: record.person?.lastName || '',
                            });
                        }
                    }
                }

                // Mostrar duplicados encontrados
                if (duplicates.length > 0) {
                    console.log(`\n[Bulk Import] ⚠️  ${duplicates.length} registros duplicados encontrados:`);
                    duplicates.forEach((dup, idx) => {
                        console.log(`  ${idx + 1}. ${dup.firstName} ${dup.lastName} | Documento: ${dup.document} | Email: ${dup.email}`);
                    });
                    console.log('');
                }

                console.log(`[Bulk Import] Individual insert complete: ${savedCount}/${batch.length} records saved`);
                return savedCount;

            } finally {
                await queryRunner.release();
            }
        };
    }
}
