import { Module } from '@nestjs/common';
import { RolesService } from './services/roles.service';
import { RolesResolver } from './resolvers/roles.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { roleEntity } from './entity/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([roleEntity])],
  providers: [RolesService, RolesResolver],
  exports: [RolesService],
})
export class RolesModule { }
