import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from './user.model';

@ObjectType()
export class UsersResponse {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field(() => [User], { nullable: true })
    users?: User[];
}

@ObjectType()
export class UserResponse {
    @Field(() => Int)
    code: number;

    @Field()
    message: string;

    @Field(() => User, { nullable: true })
    user?: User;
}
