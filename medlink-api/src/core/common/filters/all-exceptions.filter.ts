import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { REQUEST_ID_HEADER } from "../constants/request.constants";

type ErrorResponseBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
    requestId: string;
    timestamp: string;
  };
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = this.resolveMessage(exceptionResponse, exception);
    const details = Array.isArray((exceptionResponse as { message?: unknown })?.message)
      ? ((exceptionResponse as { message: unknown[] }).message)
      : [];

    this.logger.error(`Exception caught: ${message} (Status: ${status})`, exception instanceof Error ? exception.stack : String(exception));

    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: this.resolveCode(status),
        message,
        details,
        requestId: String(request.headers[REQUEST_ID_HEADER] ?? ""),
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(body);
  }

  private resolveMessage(exceptionResponse: unknown, exception: unknown): string {
    if (typeof exceptionResponse === "string") {
      return exceptionResponse;
    }
    if (
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null &&
      "message" in exceptionResponse
    ) {
      const responseMessage = exceptionResponse.message;
      if (typeof responseMessage === "string") {
        return responseMessage;
      }
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return "Internal server error";
  }

  private resolveCode(status: number): string {
    const label = HttpStatus[status] ?? "INTERNAL_SERVER_ERROR";
    return String(label).toUpperCase();
  }
}
