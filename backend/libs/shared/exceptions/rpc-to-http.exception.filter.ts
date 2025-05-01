import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class RpcToHttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host?: ArgumentsHost) {
    let parsedException;

    try {
      if (typeof exception === 'object') {
        if (exception instanceof HttpException) {
          parsedException = exception?.getResponse()
            ? exception?.getResponse()
            : exception;
        } else {
          parsedException = {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
          };
        }
      } else {
        parsedException = JSON.parse(exception);
      }
    } catch (e) {
      parsedException = {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      };
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    return response
      .status(
        parsedException.status ||
          parsedException?.statusCode ||
          HttpStatus.INTERNAL_SERVER_ERROR,
      )
      .json(parsedException);
  }
}
