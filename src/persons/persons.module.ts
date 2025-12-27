import { Module } from '@nestjs/common';
import { PersonsService } from './services/persons.service';
import { PersonsResolver } from './resolvers/persons.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { personEntity } from './entity/person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([personEntity])],
  providers: [PersonsService, PersonsResolver]
})
export class PersonsModule { }
