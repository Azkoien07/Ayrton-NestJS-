import { ObjectType, Field, ID } from "@nestjs/graphql";

@ObjectType()
export class Role {
    @Field(() => ID)
    id: number;

    @Field()
    name: string;

    @Field({ nullable: true })
    description?: string;

    @Field()
    createdAt: Date;
}
