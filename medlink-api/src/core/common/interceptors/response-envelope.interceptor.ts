import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";
import { Request } from "express";
import { REQUEST_ID_HEADER } from "../constants/request.constants";

type Envelope<T> = {
  success: true;
  message: string;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
};

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = String(request.headers[REQUEST_ID_HEADER] ?? "");

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        message: "Request completed successfully",
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          version: "v1",
        },
      })),
    );
  }
}
