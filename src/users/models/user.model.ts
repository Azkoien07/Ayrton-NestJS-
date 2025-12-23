import { ObjectType, Field, ID } from "@nestjs/graphql";
import { Role } from "../../roles/models/role.model";
import { Task } from "@/src/tasks/models/task.model";

@ObjectType()
export class User {

    @Field(() => ID)
    id: number;

    @Field({ nullable: false })
    email: string;

    @Field(() => Role)
    role: Role;

    @Field()
    createdAt: Date;

    @Field(() => [Task], { nullable: true })
    tasks?: Task[];
}