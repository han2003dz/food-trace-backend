import { NestFactory, Reflector } from '@nestjs/core'
import './loadenv'
import { AppModule } from './app.module'
import {
  ClassSerializerInterceptor,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { HttpExceptionFilter } from './exceptions/http-exception.filter'
import { ValidationException } from './exceptions/validation.exception'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(
    new NestValidationPipe({
      // whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        let messages: string[]
        if (errors[0].children?.length > 0) {
          messages = errors
            .map((error) =>
              error.children[0].children
                .map((child) => {
                  return Object.values(child.constraints)
                })
                .flat(),
            )
            .flat()
        } else {
          messages = errors
            .map((error) => Object.values(error.constraints))
            .flat()
        }

        return new ValidationException(messages)
      },
    }),
  )

  const configEnv = app.get(ConfigService)

  // const whiteList = configEnv
  //   .get('config.whiteList')
  //   ?.split(',')
  //   .map((domain) => domain.trim())
  //   .filter((domain) => !!domain)

  // Enable CORS
  app.enableCors({})

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  const config = new DocumentBuilder()
    .setTitle('Food Trace Documentation')
    .setDescription('This is the API documentation for the Food Trace system')
    .setVersion('1.0')
    .addTag('Auth')
    .addBearerAuth()
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen(configEnv.get('config.port') ?? 3000)
}
bootstrap()
