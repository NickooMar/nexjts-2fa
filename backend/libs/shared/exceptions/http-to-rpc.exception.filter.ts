import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch(exception: HttpException, host: ArgumentsHost): Observable<any> {
    return throwError(() => {
      return JSON.stringify({
        status: exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
      });
    });
  }
}
