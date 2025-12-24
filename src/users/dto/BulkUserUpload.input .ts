import { InputType, Field } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';

@InputType()
export class BulkUserUploadInput {
    @Field(() => GraphQLUpload)
    file: Promise<FileUpload>;
}
