import { ObjectType, Field } from "@nestjs/graphql";
import { BaseResponse } from "@/src/common/http/response";
import { Person } from "./person.model";

@ObjectType()
export class PersonPage extends BaseResponse {
    @Field(() => [Person], { nullable: true })
    data?: Person[];
}

@ObjectType()
export class PersonSingle extends BaseResponse {
    @Field(() => Person, { nullable: true })
    data?: Person;
}
