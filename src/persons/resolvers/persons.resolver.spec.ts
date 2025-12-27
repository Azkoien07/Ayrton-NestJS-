import { Test, TestingModule } from '@nestjs/testing';
import { PersonsResolver } from './persons.resolver';

describe('PersonsResolver', () => {
  let resolver: PersonsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonsResolver],
    }).compile();

    resolver = module.get<PersonsResolver>(PersonsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
