import { Field, ObjectType, ID } from "@nestjs/graphql";
import { DocumentType } from "@/src/document-type/models/documentType.model";

@ObjectType()
export class Person {

    @Field(() => ID)
    id: number;

    @Field({ nullable: false })
    firstName: string;

    @Field({ nullable: false })
    lastName: string;

    @Field({ nullable: false })
    document: string;

    @Field({ nullable: false })
    phone: string;

    @Field({ nullable: false })
    bloodType: string;

    @Field({ nullable: false })
    address: string;

    @Field({ nullable: true })
    photo?: string;

    @Field({ nullable: false })
    state: boolean;

    @Field(() => DocumentType, { nullable: false })
    documentType: DocumentType;

    @Field(() => Date)
    createdAt: Date;
}
