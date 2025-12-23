import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {

    @Field()
    email: string;

    @Field()
    password: string;

    @Field(() => Int, { nullable: true, defaultValue: 1 })
    roleId?: number;
}