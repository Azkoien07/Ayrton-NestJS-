import { ObjectType, Field } from "@nestjs/graphql";
import { BaseResponse } from "@/src/common/http/response";
import { User } from "./user.model";

@ObjectType()
export class UserPage extends BaseResponse {
    @Field(() => [User], { nullable: true })
    data?: User[];
}

@ObjectType()
export class UserSingle extends BaseResponse {
    @Field(() => User, { nullable: true })
    data?: User;
}
