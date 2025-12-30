import { Query, Resolver, Args, Mutation, Int, ID } from '@nestjs/graphql';
import { Task } from '../models/task.model';
import { TaskPage, TaskSingle } from '../models/task.page';
import { TasksService } from '../service/tasks.service';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { ApiResponse } from '@/src/common/http/response';
import { CreateTaskInput } from '../dto/createTask.input';
import { taskEntity } from '../entity/task.entity';

@Resolver(() => Task)
export class TasksResolver {
    constructor(private readonly tasksService: TasksService) { }

    // 1. Get all tasks with pagination
    @Query(() => TaskPage)
    async tasks(
        @Args('page', { type: () => Int }) page: number,
        @Args('limit', { type: () => Int }) limit: number
    ): Promise<TaskPage> {
        const response = await this.tasksService.findAll(page, limit);

        if (response.data.length === 0) {
            return {
                code: 404,
                message: 'No tasks found',
                data: [],
            };
        }

        return {
            code: 200,
            message: 'Tasks retrieved successfully',
            data: response.data,
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages,
        };
    }

    // 2. Get task by ID
    @Query(() => TaskSingle)
    async task(@Args('id', { type: () => ID }) id: number): Promise<TaskSingle> {
        try {
            const taskData = await this.tasksService.getById(id);
            return {
                code: 200,
                message: 'Task retrieved successfully',
                data: taskData,
            };
        } catch (error) {
            return {
                code: 404,
                message: 'Task not found',
            };
        }
    }

    // 3. Create a new task
    @Mutation(() => ApiResponse)
    async createTask(@Args('input') input: CreateTaskInput): Promise<ApiResponse> {
        const task = new taskEntity();
        task.name = input.name;
        task.description = input.description;
        task.state = input.state;
        task.priority = input.priority;
        task.type = input.type;
        task.createdAt = new Date();
        task.expirationDate = input.expirationDate;
        task.reminder = input.reminder;
        await this.tasksService.create(task);
        return ResponseFactory.success('Task created successfully', task);
    }

    // 4. Update an existing task
    @Mutation(() => ApiResponse)
    async updateTask(
        @Args('id', { type: () => ID }) id: number,
        @Args('input') input: CreateTaskInput
    ): Promise<ApiResponse<Task>> {
        try {
            const updateTask = await this.tasksService.update(id, input);
            return ResponseFactory.success('Task updated successfully', updateTask);
        } catch (error) {
            return ResponseFactory.notFound('Task not found');
        }
    }

    // 5. Delete a task by ID
    @Mutation(() => ApiResponse)
    async deleteTask(@Args('id', { type: () => ID }) id: number): Promise<ApiResponse> {
        try {
            await this.tasksService.delete(id);
            return ResponseFactory.success('Task deleted successfully');
        } catch (error) {
            return ResponseFactory.notFound('Task not found');
        }
    }

}