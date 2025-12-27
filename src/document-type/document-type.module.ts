import { Module } from '@nestjs/common';
import { DocumentTypeService } from './services/document-type.service';
import { DocumentTypeResolver } from './resolvers/document-type.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { documentTypeEntity } from '@/src/document-type/entity/documentType.entity';

@Module({
  imports: [TypeOrmModule.forFeature([documentTypeEntity])],
  providers: [DocumentTypeService, DocumentTypeResolver]
})
export class DocumentTypeModule { }
