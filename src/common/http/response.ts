import { Field, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

// Clase base abstracta para respuestas (como en Java)
@ObjectType({ isAbstract: true })
export class BaseResponse {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field({ nullable: true })
    date?: string;

    @Field(() => Int, { nullable: true })
    page?: number;

    @Field(() => Int, { nullable: true })
    limit?: number;

    @Field(() => Int, { nullable: true })
    total?: number;

    @Field(() => Int, { nullable: true })
    totalPages?: number;
}

// Para compatibilidad con código existente que usa JSON
@ObjectType()
export class ApiResponse<T = any> {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field(() => GraphQLJSON, { nullable: true })
    data?: T | T[];
}
