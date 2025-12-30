import { ObjectType, Field } from "@nestjs/graphql";
import { BaseResponse } from "@/src/common/http/response";
import { Role } from "./role.model";

@ObjectType()
export class RolePage extends BaseResponse {
    @Field(() => [Role], { nullable: true })
    data?: Role[];
}

@ObjectType()
export class RoleSingle extends BaseResponse {
    @Field(() => Role, { nullable: true })
    data?: Role;
}
