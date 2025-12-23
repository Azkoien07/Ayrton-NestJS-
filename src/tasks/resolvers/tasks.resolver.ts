import { Query, Resolver, Args, Mutation } from '@nestjs/graphql';
import { Task } from '../models/task.model';
import { TasksService } from '../service/tasks.service';
import { TasksResponse, TaskResponse } from '../models/tasks.response';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { ApiResponse } from '@/src/common/http/response';
import { CreateTaskInput } from '../dto/createTask.input';
import { taskEntity } from '../entity/task.entity';

@Resolver(() => Task)
export class TasksResolver {
    constructor(private readonly tasksService: TasksService) { }

    // 1. Get all tasks with pagination
    @Query(() => TasksResponse) async tasks(@Args('page',) page: number, @Args('limit',) limit: number,): Promise<TasksResponse> {
        const tasksData = await this.tasksService.findAll(page, limit);
        if (tasksData.length === 0) {
            const response = ResponseFactory.notFound('No tasks found');
            return {
                code: response.code,
                message: response.message,
                tasks: []
            };
        }
        const response = ResponseFactory.success('Tasks retrieved successfully', tasksData);
        return {
            code: response.code,
            message: response.message,
            tasks: tasksData
        };
    }

    // 2. Get task by ID
    @Query(() => TaskResponse) async task(@Args('id') id: number,): Promise<TaskResponse> {
        try {
            const taskData = await this.tasksService.getById(id);
            const response = ResponseFactory.success('Task retrieved successfully', taskData);
            return {
                code: response.code,
                message: response.message,
                task: taskData
            };
        } catch (error) {
            const response = ResponseFactory.notFound('Task not found');
            return {
                code: response.code,
                message: response.message,
                task: undefined
            };
        }
    }

    // 3. Create a new task
    @Mutation(() => ApiResponse) async createTask(@Args('input') input: CreateTaskInput,): Promise<ApiResponse> {
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
        const response = ResponseFactory.success('Task created successfully', task);
        return {
            code: response.code,
            message: response.message
        };
    }

    // 4. Update an existing task
    @Mutation(() => TasksResponse) async updateTask(@Args('id') id: number, @Args('input') input: CreateTaskInput,): Promise<TasksResponse> {
        try {
            const task = await this.tasksService.getById(id);
            task.name = input.name || task.name;
            task.description = input.description || task.description;
            task.state = input.state || task.state;
            task.priority = input.priority || task.priority;
            task.type = input.type || task.type;
            task.expirationDate = input.expirationDate || task.expirationDate;
            task.reminder = input.reminder !== undefined ? input.reminder : task.reminder;
            const updateTask = await this.tasksService.update(id, task);
            const response = ResponseFactory.success('Task updated successfully', updateTask);
            return {
                code: response.code,
                message: response.message,
                tasks: [updateTask]
            };
        } catch (error) {
            const response = ResponseFactory.notFound('Task not found');
            return {
                code: response.code,
                message: response.message,
                tasks: []
            };
        }
    }

    // 5. Delete a task by ID
    @Mutation(() => TasksResponse) async deleteTask(@Args('id') id: number,): Promise<TasksResponse> {
        try {
            await this.tasksService.delete(id);
            const response = ResponseFactory.success('Task deleted successfully');
            return {
                code: response.code,
                message: response.message
            };
        } catch (error) {
            const response = ResponseFactory.notFound('Task not found');
            return {
                code: response.code,
                message: response.message
            };
        }
    }

}