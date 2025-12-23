import { BaseDao } from '@/src/common/dao/base.dao';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { taskEntity } from '../entity/task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService extends BaseDao<taskEntity, number> {

    // Implementing abstract methods from BaseDao
    constructor(
        @InjectRepository(taskEntity)
        private readonly tasksRepository: Repository<taskEntity>,
    ) {
        super();
    }

    // Find all tasks with pagination
    async findAll(page: number, limit: number): Promise<taskEntity[]> {
        return this.tasksRepository.find({
            skip: (page - 1) * limit,
            take: limit,
        });
    }


    // Find task by ID
    async getById(id: number): Promise<taskEntity> {
        const task = await this.tasksRepository.findOne({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    // Create a new task
    async create(entity: taskEntity): Promise<taskEntity> {
        return this.tasksRepository.save(entity);
    }

    // Update an existing task
    async update(id: number, entity: Partial<taskEntity>,): Promise<taskEntity> {
        await this.tasksRepository.update(id, entity);
        return this.getById(id);
    }

    // Delete a task by ID
    async delete(id: number): Promise<void> {
        const result = await this.tasksRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Task not found');
        }
    }

}
