import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-minimal';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuración
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      /^http:\/\/localhost:\d+$/,  // Cualquier puerto localhost
      /^http:\/\/127\.0\.0\.1:\d+$/,  // Cualquier puerto 127.0.0.1
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Upload middleware
  app.use(graphqlUploadExpress({
    maxFileSize: 50_000_000,
    maxFiles: 1
  }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  //console.log(`🚀 Server running on http://localhost:${port}/graphql`);
}
bootstrap();
