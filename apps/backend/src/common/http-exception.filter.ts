import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      // Handle case where getResponse() returns an object with message property
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object' && 'message' in response) {
        const msg = (response as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      } else {
        message = 'An error occurred';
      }
    } else {
      // Log the actual error for debugging
      const error = exception as Error;
      console.error('Unhandled exception:', error);
      console.error('Error stack:', error.stack);
      message = error.message || 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}






