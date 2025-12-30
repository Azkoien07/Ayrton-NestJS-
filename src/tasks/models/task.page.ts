import { ObjectType, Field } from "@nestjs/graphql";
import { BaseResponse } from "@/src/common/http/response";
import { Task } from "./task.model";

@ObjectType()
export class TaskPage extends BaseResponse {
    @Field(() => [Task], { nullable: true })
    data?: Task[];
}

@ObjectType()
export class TaskSingle extends BaseResponse {
    @Field(() => Task, { nullable: true })
    data?: Task;
}
