import { Module } from '@nestjs/common';
import { TasksService } from './service/tasks.service';
import { TasksResolver } from './resolvers/tasks.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { taskEntity } from './entity/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([taskEntity])],
  providers: [TasksService, TasksResolver]
})
export class TasksModule { }
