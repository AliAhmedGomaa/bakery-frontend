import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse } from '../models/types';

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map((event) => {
      if (!(event instanceof HttpResponse)) {
        return event;
      }

      const body = event.body as ApiResponse<unknown> | null;
      if (body && typeof body === 'object' && body.success && 'data' in body) {
        return event.clone({ body: body.data });
      }

      return event;
    }),
  );
