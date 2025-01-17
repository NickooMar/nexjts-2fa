import { HttpException } from '@nestjs/common';
import { catchError, throwError } from 'rxjs';

export const handleRpcException = catchError((error) => {
  if (typeof error === 'string') {
    error = JSON.parse(error);
  }
  return throwError(
    () => new HttpException(error?.message, error?.status || error.statusCode),
  );
});
