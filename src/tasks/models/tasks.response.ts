import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Task } from "./task.model";

@ObjectType()
export class TasksResponse {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field(() => [Task], { nullable: true })
    tasks?: Task[];
}

@ObjectType()
export class TaskResponse {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field(() => Task, { nullable: true })
    task?: Task;
}