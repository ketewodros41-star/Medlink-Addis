import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./core/common/filters/all-exceptions.filter";
import { ResponseEnvelopeInterceptor } from "./core/common/interceptors/response-envelope.interceptor";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // Security headers (OWASP best practices)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.enableCors({
    origin: config.getOrThrow<string>("app.corsOrigins").split(","),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  const apiPrefix = config.getOrThrow<string>("app.apiPrefix");
  const apiVersion = config.getOrThrow<string>("app.apiVersion");
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`, {
    exclude: ["health/live", "health/ready"],
  });

  await app.listen(config.getOrThrow<number>("app.port"));
}

void bootstrap();
