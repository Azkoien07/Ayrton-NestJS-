import { ObjectType, Field, ID } from "@nestjs/graphql";
import { Role } from "../../roles/models/role.model";
import { Person } from "@/src/persons/models/person.model";

@ObjectType()
export class User {

    @Field(() => ID)
    id: number;

    @Field({ nullable: false })
    email: string;

    @Field(() => Role)
    role: Role;

    @Field(() => Person, { nullable: true })
    person?: Person;

    @Field()
    createdAt: Date;
}