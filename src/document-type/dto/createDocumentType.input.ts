import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateDocumentTypeInput {

    @Field()
    name: string;

    @Field()
    acronym: string;

    @Field()
    state: boolean;
}