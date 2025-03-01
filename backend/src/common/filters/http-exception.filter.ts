import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import * as mongoose from 'mongoose';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Unknown error';

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? Array.isArray(exceptionResponse.message)
            ? exceptionResponse.message[0]
            : exceptionResponse.message
          : exception.message;
      error = exception.name;
    }
    // Handle MongoDB duplicate key errors
    else if (exception instanceof MongoError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      error = 'Duplicate Key Error';

      // Extract the duplicate field
      const keyPattern = (exception as any).keyPattern;
      const keyValue = (exception as any).keyValue;

      if (keyPattern && keyValue) {
        const field = Object.keys(keyPattern)[0];
        const value = keyValue[field];
        message = `${field} '${value}' already exists`;
      } else {
        message = 'A duplicate key error occurred';
      }
    }
    // Handle Mongoose validation errors
    else if (exception instanceof mongoose.Error.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Validation Error';

      const errors = Object.values(exception.errors).map((err) => err.message);
      message = errors.length > 0 ? errors[0] : 'Validation failed';
    }
    // Handle Mongoose CastErrors (invalid ObjectId, etc)
    else if (exception instanceof mongoose.Error.CastError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Invalid ID Format';

      if (exception.path && exception.value) {
        message = `Invalid ${exception.path}: '${exception.value}'`;
      } else {
        message = 'Invalid ID format';
      }
    }
    // Handle other errors
    else if (exception instanceof Error) {
      error = exception.name;
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    });
  }
}
