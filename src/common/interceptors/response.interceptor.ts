import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MSG_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { params?: Record<string, any> }>();

    // allow per-route override
    const customMsg =
      this.reflector.get<string>(RESPONSE_MSG_KEY, context.getHandler()) ||
      this.reflector.get<string>(RESPONSE_MSG_KEY, context.getClass());

    const defaultMsg = this.buildMessage(req.method, req.params || {});

    return next.handle().pipe(
      map((result) => {
        if (
          result &&
          typeof result === 'object' &&
          'status' in result &&
          'message' in result
        ) {
          return result;
        }

        return {
          status: 'success',
          message: customMsg || defaultMsg,
          document: result,
        };
      }),
    );
  }

  private buildMessage(method: string, params: Record<string, any>): string {
    const m = (method || 'GET').toUpperCase();
    const actionMap: Record<string, string> = {
      GET: 'fetched',
      POST: 'created',
      PUT: 'updated',
      PATCH: 'updated',
      DELETE: 'deleted',
    };
    const action = actionMap[m] ?? 'processed';

    const isSingle = !!params && Object.keys(params).length > 0;

    if (m === 'GET') {
      return isSingle
        ? 'Successfully fetched document'
        : 'Successfully fetched documents';
    }

    // For non-GET methods always use singular "document"
    return `Successfully ${action} document`;
  }
}
