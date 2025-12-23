import { User } from '@/src/users/models/user.model';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Task {
    @Field(() => ID)
    id: number;

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
    createdAt: Date;

    @Field()
    expirationDate: Date;

    @Field()
    reminder: boolean;

    @Field(() => [User], { nullable: false })
    users: User[];
}