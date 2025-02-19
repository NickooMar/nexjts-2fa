// import {
//   Logger,
//   Injectable,
//   CallHandler,
//   NestInterceptor,
//   ExecutionContext,
// } from '@nestjs/common';
// import { tap } from 'rxjs/operators';
// import { IncomingMessage } from 'http';
// import { catchError, Observable, throwError } from 'rxjs';

// @Injectable()
// export class LoggingInterceptor implements NestInterceptor {
//   private logger: Logger;

//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     this.logger = new Logger(context.getClass().name);

//     const now = Date.now();
//     return next.handle().pipe(
//       tap(() => {
//         const duration = Date.now() - now;
//         const { body, params, query } = context.switchToHttp().getRequest();

//         const args = context.getArgs()[0];
//         this.logger.log(
//           `${context.getClass().name}@${
//             context.getHandler().name
//           } +${duration}ms`,
//         );
//         if (!(args instanceof IncomingMessage)) this.logger.log(args);
//         else if (context.switchToHttp().getRequest())
//           this.logger.log({ body, params, query });
//       }),
//       catchError((error) => {
//         // const duration = Date.now() - now;
//         // if (typeof error === 'object') {
//         //   if (error.status || error.statusCode) {
//         //     this.logger.error(
//         //       `${error.status || error.statusCode} - ${
//         //         error.message
//         //       } +${duration}ms`,
//         //     );
//         //   } else {
//         //     this.logger.error(`${error.message} +${duration}ms`);
//         //   }
//         //   if (error?.stack) {
//         //     this.logger.error(`${error?.stack} +${duration}ms`);
//         //   }
//         // } else {
//         //   const exception = JSON.parse(error) as {
//         //     status: number;
//         //     message: string;
//         //   };
//         //   this.logger.error(
//         //     `${exception.status} - ${exception.message} +${duration}ms`,
//         //   );
//         // }
//         // return throwError(error);
//       }),
//     );
//   }
// }
