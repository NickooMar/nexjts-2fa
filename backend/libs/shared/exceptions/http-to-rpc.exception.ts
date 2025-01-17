import {
  Catch,
  HttpStatus,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

@Catch(HttpException)
export class HttpToRpcExceptionFilter implements ExceptionFilter {
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
