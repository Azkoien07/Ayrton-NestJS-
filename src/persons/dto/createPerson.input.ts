import { InputType, Field, Int } from "@nestjs/graphql";

@InputType()
export class CreatePersonInput {

    @Field()
    firstName: string;

    @Field()
    lastName: string;

    @Field()
    document: string;

    @Field()
    phone: string;

    @Field()
    bloodType: string;

    @Field()
    address: string;

    @Field({ nullable: true })
    photo?: string;

    @Field()
    state: boolean;

    @Field(() => Int)
    documentTypeId: number;

    // User fields
    @Field()
    email: string;

    @Field()
    password: string;

    @Field(() => Int, { nullable: true, defaultValue: 1 })
    roleId?: number;

}