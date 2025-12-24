import { Query, Resolver, Args, Mutation } from '@nestjs/graphql';
import { Task } from '../models/task.model';
import { TasksService } from '../service/tasks.service';
import { ResponseFactory } from '@/src/common/http/response.factory';
import { ApiResponse } from '@/src/common/http/response';
import { CreateTaskInput } from '../dto/createTask.input';
import { taskEntity } from '../entity/task.entity';

@Resolver(() => Task)
export class TasksResolver {
    constructor(private readonly tasksService: TasksService) { }

    // 1. Get all tasks with pagination
    @Query(() => ApiResponse) async tasks(@Args('page',) page: number, @Args('limit',) limit: number,): Promise<ApiResponse<Task[]>> {
        const tasksData = await this.tasksService.findAll(page, limit);
        if (tasksData.length === 0) {
            return ResponseFactory.notFound('No tasks found');
        }
        return ResponseFactory.success('Tasks retrieved successfully', tasksData);
    }

    // 2. Get task by ID
    @Query(() => ApiResponse) async task(@Args('id') id: number,): Promise<ApiResponse<Task>> {
        try {
            const taskData = await this.tasksService.getById(id);
            return ResponseFactory.success('Task retrieved successfully', taskData);
        } catch (error) {
            return ResponseFactory.notFound('Task not found');
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
        return ResponseFactory.success('Task created successfully', task);
    }

    // 4. Update an existing task
    @Mutation(() => ApiResponse) async updateTask(@Args('id') id: number, @Args('input') input: CreateTaskInput,): Promise<ApiResponse<Task>> {
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
            return ResponseFactory.success('Task updated successfully', updateTask);
        } catch (error) {
            return ResponseFactory.notFound('Task not found');
        }
    }

    // 5. Delete a task by ID
    @Mutation(() => ApiResponse) async deleteTask(@Args('id') id: number,): Promise<ApiResponse> {
        try {
            await this.tasksService.delete(id);
            return ResponseFactory.success('Task deleted successfully');
        } catch (error) {
            return ResponseFactory.notFound('Task not found');
        }
    }

}