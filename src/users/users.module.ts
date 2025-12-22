import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersResolver } from './resolvers/users.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { userEntity } from './entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([userEntity])],
  providers: [UsersService, UsersResolver]
})
export class UsersModule { }
