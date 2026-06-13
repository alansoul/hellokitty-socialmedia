// apps/core-api/src/app/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Determine if it's a known HTTP error, or a random crash
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'An unexpected error occurred on the server.';

    // 1. Log the hardcore technical error to our server terminal (for us to debug)
    const stack = exception instanceof Error ? exception.stack : '';
    this.logger.error(
      `[${request.method}] ${request.url} - ${status} - ${message}`,
      stack,
    );

    // 2. Send a beautifully formatted, safe response to the Next.js Frontend
    response.status(status).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
