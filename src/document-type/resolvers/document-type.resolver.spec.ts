import { Test, TestingModule } from '@nestjs/testing';
import { DocumentTypeResolver } from './document-type.resolver';

describe('DocumentTypeResolver', () => {
  let resolver: DocumentTypeResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentTypeResolver],
    }).compile();

    resolver = module.get<DocumentTypeResolver>(DocumentTypeResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
