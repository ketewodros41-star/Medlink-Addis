import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ms }) => {
              return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message} ${ms}`;
            }),
          ),
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}
