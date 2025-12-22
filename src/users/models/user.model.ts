import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class User {

    @Field(() => ID)
    id: number;

    @Field({ nullable: false })
    email: string;

    @Field()
    role: string;

    @Field()
    createdAt: Date;
}