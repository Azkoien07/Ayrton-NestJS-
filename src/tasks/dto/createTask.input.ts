import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class CreateTaskInput {

    @Field()
    name: string;

    @Field()
    description: string;

    @Field()
    state: string;

    @Field()
    priority: string;

    @Field()
    type: string;

    @Field()
    expirationDate: Date;

    @Field()
    reminder: boolean;
}