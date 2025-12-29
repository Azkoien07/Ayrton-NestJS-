import { Logger } from '@nestjs/common';
import { Repository, ObjectLiteral } from 'typeorm';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as ExcelJS from 'exceljs';

/**
 * Configuration for bulk import operations
 */
export interface BulkImportConfig<T extends ObjectLiteral> {
    repository: Repository<T>;
    logger: Logger;
    batchSize?: number;
    entityName?: string;
    ignoreDuplicates?: boolean; // Skip duplicate records instead of failing
    customInserter?: CustomBatchInserter<T>; // Custom insertion logic for complex cases
}

/**
 * Statistics about the import operation
 */
export interface ImportStatistics {
    totalProcessed: number;
    totalInserted: number;
    totalSkipped: number;
    totalBatches: number;
    startTime: Date;
    endTime?: Date;
    durationMs?: number;
}

/**
 * Mapper function type for converting raw row data to entity
 */
export type RowMapper<T extends ObjectLiteral> = (row: any) => Promise<Partial<T> | null>;

/**
 * Custom batch inserter function for complex insertions (e.g., multi-table inserts)
 * Returns the number of successfully inserted records
 */
export type CustomBatchInserter<T extends ObjectLiteral> = (
    batch: Partial<T>[],
    repository: Repository<T>,
) => Promise<number>;

/**
 * Generic helper class for bulk importing data from CSV and XLSX files
 * Can be used with any TypeORM entity
 */
export class BulkImportHelper {
    private static readonly DEFAULT_BATCH_SIZE = 400;

    /**
     * Imports data from CSV or XLSX file (auto-detects format)
     * @param filePath Path to the file
     * @param originalName Original filename with extension
     * @param config Import configuration
     * @param rowMapper Function to map row data to entity
     * @returns Import statistics
     */
    static async importFromFile<T extends ObjectLiteral>(
        filePath: string,
        originalName: string,
        config: BulkImportConfig<T>,
        rowMapper: RowMapper<T>,
    ): Promise<ImportStatistics> {
        const ext = originalName.split('.').pop()?.toLowerCase();

        if (!ext || !['csv', 'xlsx'].includes(ext)) {
            throw new Error('Unsupported file format. Please upload a CSV or XLSX file.');
        }

        if (ext === 'csv') {
            return this.importFromCsv(filePath, config, rowMapper);
        } else {
            return this.importFromXlsx(filePath, config, rowMapper);
        }
    }

    /**
     * Imports data from CSV file
     * @param filePath Path to the CSV file
     * @param config Import configuration
     * @param rowMapper Function to map row data to entity
     * @returns Import statistics
     */
    static async importFromCsv<T extends ObjectLiteral>(
        filePath: string,
        config: BulkImportConfig<T>,
        rowMapper: RowMapper<T>,
    ): Promise<ImportStatistics> {
        const { repository, logger, batchSize = this.DEFAULT_BATCH_SIZE, entityName = 'records', ignoreDuplicates = false } = config;

        const stats: ImportStatistics = {
            totalProcessed: 0,
            totalInserted: 0,
            totalSkipped: 0,
            totalBatches: 0,
            startTime: new Date(),
        };

        let batch: Partial<T>[] = [];

        const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || filePath;
        logger.log(`[Bulk Import] Starting CSV import for ${entityName} from: ${fileName}`);
        logger.log(`[Bulk Import] Batch size: ${batchSize} records per batch`);

        try {
            const stream = fs.createReadStream(filePath).pipe(csv());

            for await (const row of stream) {
                stats.totalProcessed++;

                const entity = await rowMapper(row);

                if (!entity) {
                    stats.totalSkipped++;
                    continue;
                }

                batch.push(entity);

                if (batch.length >= batchSize) {
                    stats.totalBatches++;
                    const batchStart = Date.now();
                    const inserted = await this.insertBatch(batch, repository, logger, ignoreDuplicates, config.customInserter);
                    const batchTime = Date.now() - batchStart;
                    stats.totalInserted += inserted;
                    const duplicates = batch.length - inserted;
                    stats.totalSkipped += duplicates;

                    logger.log(`[Bulk Import] Batch #${stats.totalBatches} | Inserted: ${inserted}/${batch.length} | Time: ${batchTime}ms | Total: ${stats.totalInserted}`);
                    batch = [];
                }
            }

            // Insert remaining records
            if (batch.length > 0) {
                stats.totalBatches++;
                const inserted = await this.insertBatch(batch, repository, logger, ignoreDuplicates, config.customInserter);
                stats.totalInserted += inserted;
                const duplicates = batch.length - inserted;
                stats.totalSkipped += duplicates;
                logger.log(`[Bulk Import] Final batch #${stats.totalBatches} completed | Inserted: ${inserted} records`);
            }

            stats.endTime = new Date();
            stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();

            logger.log(
                `[Bulk Import] CSV import completed successfully\n` +
                `  Total processed: ${stats.totalProcessed} records\n` +
                `  Successfully inserted: ${stats.totalInserted} records\n` +
                `  Duplicates skipped: ${stats.totalSkipped} records\n` +
                `  Invalid rows skipped: ${stats.totalProcessed - stats.totalInserted - stats.totalSkipped} records\n` +
                `  Total batches: ${stats.totalBatches}\n` +
                `  Duration: ${(stats.durationMs / 1000).toFixed(2)}s`
            );

            return stats;

        } catch (error) {
            logger.error(`[Bulk Import] Error during CSV import: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Imports data from XLSX file using streaming
     * @param filePath Path to the XLSX file
     * @param config Import configuration
     * @param rowMapper Function to map row data to entity
     * @returns Import statistics
     */
    static async importFromXlsx<T extends ObjectLiteral>(
        filePath: string,
        config: BulkImportConfig<T>,
        rowMapper: RowMapper<T>,
    ): Promise<ImportStatistics> {
        const { repository, logger, batchSize = this.DEFAULT_BATCH_SIZE, entityName = 'records', ignoreDuplicates = false } = config;

        const stats: ImportStatistics = {
            totalProcessed: 0,
            totalInserted: 0,
            totalSkipped: 0,
            totalBatches: 0,
            startTime: new Date(),
        };

        let batch: Partial<T>[] = [];

        const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || filePath;
        logger.log(`[Bulk Import] Starting XLSX import for ${entityName} from: ${fileName}`);
        logger.log(`[Bulk Import] Batch size: ${batchSize} records per batch`);

        try {
            const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
                entries: 'emit',
                worksheets: 'emit',
                sharedStrings: 'cache',
                hyperlinks: 'ignore',
            });

            for await (const worksheet of workbook) {
                for await (const row of worksheet) {
                    // Skip header row
                    if (row.number === 1) {
                        continue;
                    }

                    stats.totalProcessed++;

                    const entity = await rowMapper(row);

                    if (!entity) {
                        stats.totalSkipped++;
                        continue;
                    }

                    batch.push(entity);

                    if (batch.length >= batchSize) {
                        stats.totalBatches++;
                        const batchStart = Date.now();
                        const inserted = await this.insertBatch(batch, repository, logger, ignoreDuplicates, config.customInserter);
                        const batchTime = Date.now() - batchStart;
                        stats.totalInserted += inserted;
                        const duplicates = batch.length - inserted;
                        stats.totalSkipped += duplicates;

                        logger.log(`[Bulk Import] Batch #${stats.totalBatches} | Inserted: ${inserted}/${batch.length} | Time: ${batchTime}ms | Total: ${stats.totalInserted}`);
                        batch = [];
                    }
                }
            }

            // Insert remaining records
            if (batch.length > 0) {
                stats.totalBatches++;
                const inserted = await this.insertBatch(batch, repository, logger, ignoreDuplicates, config.customInserter);
                stats.totalInserted += inserted;
                const duplicates = batch.length - inserted;
                stats.totalSkipped += duplicates;
                logger.log(`[Bulk Import] Final batch #${stats.totalBatches} completed | Inserted: ${inserted} records`);
            }

            stats.endTime = new Date();
            stats.durationMs = stats.endTime.getTime() - stats.startTime.getTime();

            logger.log(
                `[Bulk Import] XLSX import completed successfully\n` +
                `  Total processed: ${stats.totalProcessed} records\n` +
                `  Successfully inserted: ${stats.totalInserted} records\n` +
                `  Duplicates skipped: ${stats.totalSkipped} records\n` +
                `  Invalid rows skipped: ${stats.totalProcessed - stats.totalInserted - stats.totalSkipped} records\n` +
                `  Total batches: ${stats.totalBatches}\n` +
                `  Duration: ${(stats.durationMs / 1000).toFixed(2)}s`
            );

            return stats;

        } catch (error) {
            logger.error(`[Bulk Import] Error during XLSX import: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Inserts a batch of entities into the database
     * @param batch Array of entities to insert
     * @param repository TypeORM repository
     * @param logger Logger instance
     * @param ignoreDuplicates Skip duplicate records
     * @param customInserter Optional custom insertion function
     */
    private static async insertBatch<T extends ObjectLiteral>(
        batch: Partial<T>[],
        repository: Repository<T>,
        logger: Logger,
        ignoreDuplicates: boolean = false,
        customInserter?: CustomBatchInserter<T>,
    ): Promise<number> {
        const startTime = Date.now();
        let inserted = 0;

        try {
            // Use custom inserter if provided
            if (customInserter) {
                inserted = await customInserter(batch, repository);
                return inserted;
            }

            if (ignoreDuplicates) {
                // Estrategia optimizada: Intentar inserción por lote primero
                try {
                    await repository
                        .createQueryBuilder()
                        .insert()
                        .values(batch as any[])
                        .execute();
                    inserted = batch.length;
                } catch (error) {
                    // Si falla por duplicados, procesar uno por uno solo este batch
                    if (error.message?.includes('UNIQUE KEY constraint') ||
                        error.message?.includes('duplicate key')) {
                        logger.log(`[Bulk Import] Batch has duplicates, processing ${batch.length} records individually...`);

                        for (let i = 0; i < batch.length; i++) {
                            const record = batch[i];
                            try {
                                await repository
                                    .createQueryBuilder()
                                    .insert()
                                    .values(record as any)
                                    .execute();
                                inserted++;
                            } catch (dupError) {
                                // Log solo duplicados confirmados
                                if (dupError.message?.includes('UNIQUE KEY constraint') ||
                                    dupError.message?.includes('duplicate key')) {
                                    logger.warn(`[Bulk Import] Record #${i + 1} skipped (duplicate): ${JSON.stringify(record).substring(0, 100)}`);
                                } else {
                                    logger.error(`[Bulk Import] Record #${i + 1} failed: ${dupError.message}`);
                                }
                            }
                        }
                        logger.log(`[Bulk Import] Individual processing complete: ${inserted}/${batch.length} inserted`);
                    } else {
                        // Si es otro error, relanzar
                        throw error;
                    }
                }
            } else {
                // Inserción normal por lote sin manejo de duplicados
                await repository
                    .createQueryBuilder()
                    .insert()
                    .values(batch as any[])
                    .execute();
                inserted = batch.length;
            }

            return inserted;

        } catch (error) {
            logger.error(`[Bulk Import] Batch insert failed (${batch.length} records): ${error.message}`);
            throw error;
        }
    }
}
