import { Field, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class ApiResponse<T = any> {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field(() => GraphQLJSON, { nullable: true })
    data?: T | T[];
}
