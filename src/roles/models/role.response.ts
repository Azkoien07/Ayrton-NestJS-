import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Role } from "./role.model";

@ObjectType()
export class RolesResponse {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;
    @Field(() => [Role], { nullable: true })
    roles?: Role[];
}

@ObjectType()
export class RoleResponse {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field(() => Role, { nullable: true })
    role?: Role;
}