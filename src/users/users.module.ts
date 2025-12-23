import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersResolver } from './resolvers/users.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { userEntity } from './entity/user.entity';
import { RolesModule } from '@/src/roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([userEntity]), RolesModule],
  providers: [UsersService, UsersResolver]
})
export class UsersModule { }
