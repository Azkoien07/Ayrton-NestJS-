import { Field, ObjectType, ID } from "@nestjs/graphql";

@ObjectType()
export class DocumentType {

    @Field(() => ID)
    id: number;

    @Field({ nullable: false })
    name: string;

    @Field({ nullable: false })
    acronym: string;

    @Field({ nullable: false })
    state: boolean;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}
