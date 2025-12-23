import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { userEntity } from '../entity/user.entity';
import { BaseDao } from '@/src/common/dao/base.dao';

@Injectable()
export class UsersService extends BaseDao<userEntity, number> {

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
}